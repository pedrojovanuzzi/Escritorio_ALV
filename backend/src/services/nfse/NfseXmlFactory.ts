import { PRESTADOR } from "../../config/nfse";

export interface DadosRps {
  uuidLanc: string;
  numeroRps: number;
  serieRps: string;
  tipoRps: string | number;
  dataEmissao: Date;
  status: string | number; // 1 = normal
  valorServicos: number;
  aliquota: string; // ex. "5.0000"
  issRetido: number; // 1 = retido, 2 = não
  responsavelRetencao: number;
  itemListaServico: string;
  discriminacao: string;
  codigoMunicipio: string;
  exigibilidadeIss: number; // 1 = exigível
  // tomador
  tomadorCpfCnpj: string;
  tomadorRazaoSocial: string;
  tomadorEndereco: string;
  tomadorNumero: string;
  tomadorComplemento: string;
  tomadorBairro: string;
  tomadorCodigoMunicipio: string;
  tomadorUf: string;
  tomadorCep: string;
  tomadorTelefone: string;
  tomadorEmail: string;
  // tributação
  regimeEspecial: string;
  optanteSimples: string | number;
  incentivoFiscal: number;
}

/**
 * Monta os XMLs do padrão ABRASF 2.01 (provedor Fiorilli) — RPS, lote e envelope SOAP.
 */
export class NfseXmlFactory {
  private CNAE = PRESTADOR.cnae;

  private cleanXml(xml: string): string {
    return xml
      .replace(/[\r\n]+/g, "")
      .replace(/\s{2,}/g, " ")
      .replace(/>\s+</g, "><")
      .trim();
  }

  createRpsXml(d: DadosRps): string {
    const cpfCnpj = d.tomadorCpfCnpj.replace(/[^0-9]/g, "");
    const isCpf = cpfCnpj.length === 11;
    const cpfCnpjTag = isCpf ? "Cpf" : "Cnpj";
    const dataIso = d.dataEmissao.toISOString().substring(0, 10);

    const xml = `
      <Rps xmlns="http://www.abrasf.org.br/nfse.xsd">
        <InfDeclaracaoPrestacaoServico Id="RPS${d.uuidLanc}">
          <Rps>
            <IdentificacaoRps>
              <Numero>${d.numeroRps}</Numero>
              <Serie>${d.serieRps}</Serie>
              <Tipo>${d.tipoRps}</Tipo>
            </IdentificacaoRps>
            <DataEmissao>${dataIso}</DataEmissao>
            <Status>${d.status}</Status>
          </Rps>
          <Competencia>${dataIso}</Competencia>
          <Servico>
            <Valores>
              <ValorServicos>${d.valorServicos.toFixed(2)}</ValorServicos>
              <Aliquota>${d.aliquota}</Aliquota>
            </Valores>
            <IssRetido>${d.issRetido}</IssRetido>
            <ResponsavelRetencao>${d.responsavelRetencao}</ResponsavelRetencao>
            <ItemListaServico>${d.itemListaServico}</ItemListaServico>
            <CodigoCnae>${this.CNAE}</CodigoCnae>
            <Discriminacao>${d.discriminacao}</Discriminacao>
            <CodigoMunicipio>${d.codigoMunicipio}</CodigoMunicipio>
            <ExigibilidadeISS>${d.exigibilidadeIss}</ExigibilidadeISS>
          </Servico>
          <Prestador>
            <CpfCnpj><Cnpj>${PRESTADOR.cnpj}</Cnpj></CpfCnpj>
            <InscricaoMunicipal>${PRESTADOR.inscricaoMunicipal}</InscricaoMunicipal>
          </Prestador>
          <Tomador>
            <IdentificacaoTomador>
              <CpfCnpj><${cpfCnpjTag}>${cpfCnpj}</${cpfCnpjTag}></CpfCnpj>
            </IdentificacaoTomador>
            <RazaoSocial>${d.tomadorRazaoSocial}</RazaoSocial>
            <Endereco>
              <Endereco>${d.tomadorEndereco}</Endereco>
              <Numero>${d.tomadorNumero}</Numero>
              <Complemento>${d.tomadorComplemento}</Complemento>
              <Bairro>${d.tomadorBairro}</Bairro>
              <CodigoMunicipio>${d.tomadorCodigoMunicipio}</CodigoMunicipio>
              <Uf>${d.tomadorUf}</Uf>
              <Cep>${d.tomadorCep.replace(/\D/g, "")}</Cep>
            </Endereco>
            <Contato>
              <Telefone>${d.tomadorTelefone}</Telefone>
              <Email>${d.tomadorEmail}</Email>
            </Contato>
          </Tomador>
          ${
            d.regimeEspecial
              ? `<RegimeEspecialTributacao>${d.regimeEspecial}</RegimeEspecialTributacao>`
              : ""
          }
          <OptanteSimplesNacional>${d.optanteSimples}</OptanteSimplesNacional>
          <IncentivoFiscal>${d.incentivoFiscal}</IncentivoFiscal>
        </InfDeclaracaoPrestacaoServico>
      </Rps>
    `;
    return this.cleanXml(xml);
  }

  createLoteXml(
    idLote: string,
    quantidadeRps: number,
    listaRps: string
  ): string {
    const lote = `
      <LoteRps versao="2.01" Id="${idLote}">
        <NumeroLote>1</NumeroLote>
        <CpfCnpj><Cnpj>${PRESTADOR.cnpj}</Cnpj></CpfCnpj>
        <InscricaoMunicipal>${PRESTADOR.inscricaoMunicipal}</InscricaoMunicipal>
        <QuantidadeRps>${quantidadeRps}</QuantidadeRps>
        <ListaRps>${listaRps}</ListaRps>
      </LoteRps>
    `;
    return this.cleanXml(lote);
  }

  createEnviarLoteSoap(
    loteXml: string,
    username: string,
    password: string
  ): string {
    const envio = `<EnviarLoteRpsSincronoEnvio xmlns="http://www.abrasf.org.br/nfse.xsd">${loteXml}</EnviarLoteRpsSincronoEnvio>`;
    const soap = `<?xml version="1.0" encoding="UTF-8"?>
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.issweb.fiorilli.com.br/" xmlns:xd="http://www.w3.org/2000/09/xmldsig#">
        <soapenv:Header/>
        <soapenv:Body>
          <ws:recepcionarLoteRpsSincrono>
            ${envio}
            <username>${username}</username>
            <password>${password}</password>
          </ws:recepcionarLoteRpsSincrono>
        </soapenv:Body>
      </soapenv:Envelope>`;
    return this.cleanXml(soap);
  }

  createConsultaNfseRpsEnvio(
    numero: string | number,
    serie: string,
    tipo: string
  ): string {
    const dados = `<IdentificacaoRps><Numero>${numero}</Numero><Serie>${serie}</Serie><Tipo>${tipo}</Tipo></IdentificacaoRps><Prestador><CpfCnpj><Cnpj>${PRESTADOR.cnpj}</Cnpj></CpfCnpj><InscricaoMunicipal>${PRESTADOR.inscricaoMunicipal}</InscricaoMunicipal></Prestador>`;
    return `<ConsultarNfseRpsEnvio xmlns="http://www.abrasf.org.br/nfse.xsd">${dados}</ConsultarNfseRpsEnvio>`;
  }

  createConsultaNfseSoap(
    envioXml: string,
    username: string,
    password: string
  ): string {
    return this.cleanXml(`<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.issweb.fiorilli.com.br/" xmlns:xd="http://www.w3.org/2000/09/xmldsig#"><soapenv:Header/><soapenv:Body><ws:consultarNfsePorRps>${envioXml}<username>${username}</username><password>${password}</password></ws:consultarNfsePorRps></soapenv:Body></soapenv:Envelope>`);
  }
}
