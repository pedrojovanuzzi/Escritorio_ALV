import axios from "axios";
import * as fs from "fs";
import * as https from "https";
import * as forge from "node-forge";
import { SignedXml } from "xml-crypto";
import { processarCertificado } from "../../utils/certUtils";

/**
 * Provider Fiorilli (ABRASF): assina o XML com o certificado A1 e envia o
 * envelope SOAP ao webservice, usando o certificado como TLS client cert.
 */
export class FiorilliProvider {
  constructor(
    private certPath: string,
    private tempDir: string,
    private wsdlUrl: string
  ) {}

  /** Extrai chave privada e certificado X509 do .pfx. */
  private extrairChaveECertificado(password: string) {
    const pfxBuffer = fs.readFileSync(this.certPath);
    const p12Asn1 = forge.asn1.fromDer(pfxBuffer.toString("binary"));
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
    let privateKeyPem = "";
    let certificatePem = "";
    p12.safeContents.forEach((s) => {
      s.safeBags.forEach((b) => {
        if (b.type === forge.pki.oids.pkcs8ShroudedKeyBag && b.key) {
          privateKeyPem = forge.pki.privateKeyToPem(b.key);
        } else if (b.type === forge.pki.oids.certBag && b.cert) {
          certificatePem = forge.pki.certificateToPem(b.cert);
        }
      });
    });
    const x509Certificate = certificatePem
      .replace(/-----BEGIN CERTIFICATE-----/g, "")
      .replace(/-----END CERTIFICATE-----/g, "")
      .replace(/\s+/g, "");
    return { privateKeyPem, x509Certificate };
  }

  /** Assina o XML (enveloped) na referência informada (Id do RPS ou Lote). */
  assinarXml(xml: string, referenceId: string, password: string): string {
    const { privateKeyPem, x509Certificate } =
      this.extrairChaveECertificado(password);
    // Assinatura com prefixo "ds:" e namespace EXPLÍCITO (xmlns:ds=...). O
    // validador do Fiorilli não respeita a redeclaração de namespace default
    // (<Signature xmlns="xmldsig"> dentro de xmlns="abrasf"): ele lê a tag como
    // {abrasf}Signature e rejeita com L4 "Signature unexpected". O prefixo ds:
    // resolve o namespace sem ambiguidade. Por isso o KeyInfo também é prefixado.
    const keyInfoContent = `<ds:X509Data><ds:X509Certificate>${x509Certificate}</ds:X509Certificate></ds:X509Data>`;
    // O webservice exige canonicalização INCLUSIVA (REC-xml-c14n-20010315),
    // não a exclusiva (exc-c14n). Confirmado em integrações Fiorilli/ACBr.
    const C14N = "http://www.w3.org/TR/2001/REC-xml-c14n-20010315";
    const signer = new SignedXml({
      implicitTransforms: [C14N],
      privateKey: privateKeyPem,
      publicCert: x509Certificate,
      signatureAlgorithm: "http://www.w3.org/2000/09/xmldsig#rsa-sha1",
      canonicalizationAlgorithm: C14N,
      getKeyInfoContent: () => keyInfoContent,
    });
    signer.addReference({
      xpath: `//*[local-name(.)='${referenceId}']`,
      digestAlgorithm: "http://www.w3.org/2000/09/xmldsig#sha1",
      transforms: ["http://www.w3.org/2000/09/xmldsig#enveloped-signature", C14N],
    });
    signer.computeSignature(xml, {
      prefix: "ds",
      location: {
        reference: `//*[local-name(.)='${referenceId}']`,
        action: "after",
      },
    });
    return signer.getSignedXml();
  }

  /** Envia o envelope SOAP ao webservice usando o certificado como TLS client. */
  async sendSoapRequest(
    soapXml: string,
    soapAction: string,
    password: string
  ): Promise<any> {
    const certPathToUse = processarCertificado(
      this.certPath,
      password,
      this.tempDir
    );
    const pfxBuffer = fs.readFileSync(certPathToUse);
    const httpsAgent = new https.Agent({
      pfx: pfxBuffer,
      passphrase: password,
      rejectUnauthorized: false,
    });

    // validateStatus: aceita qualquer status para NÃO descartar o corpo da
    // resposta. Webservices SOAP costumam devolver o Fault (motivo real do erro)
    // com HTTP 500 — sem isso, só veríamos "Request failed with status code 500".
    const response = await axios.post(this.wsdlUrl, soapXml, {
      httpsAgent,
      timeout: 600000,
      validateStatus: () => true,
      headers: {
        "Content-Type": "text/xml; charset=UTF-8",
        SOAPAction: soapAction,
      },
    });

    const data =
      typeof response.data === "string"
        ? response.data
        : response.data == null
        ? ""
        : String(response.data);

    // Erro HTTP sem corpo SOAP aproveitável: propaga com status + trecho do corpo.
    if (
      response.status >= 400 &&
      !/Fault|MensagemRetorno|InfNfse|Nfse|Retorno/i.test(data)
    ) {
      throw new Error(
        `Webservice retornou HTTP ${response.status}. Resposta: ${
          data.slice(0, 800) || "(corpo vazio)"
        }`
      );
    }

    return data;
  }
}
