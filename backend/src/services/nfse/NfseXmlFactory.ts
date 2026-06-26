export interface PrestadorRps {
  cnpj: string;
  inscricaoMunicipal: string;
  cnae: string;
}

export interface DadosRps {
  prestador: PrestadorRps;
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
  codigoTributacaoMunicipio?: string;
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
  private cleanXml(xml: string): string {
    return xml
      .replace(/[\r\n]+/g, "")
      .replace(/\s{2,}/g, " ")
      .replace(/>\s+</g, "><")
      .trim();
  }

  /**
   * Emite a tag apenas se houver conteúdo. Os campos opcionais do ABRASF têm
   * minLength=1 (tsComplementoEndereco, etc.); enviar a tag vazia é rejeitado
   * com L4 "cvc-minLength-valid". Por isso campos vazios são omitidos.
   */
  private tag(name: string, value: any): string {
    const v = value == null ? "" : String(value).trim();
    return v ? `<${name}>${v}</${name}>` : "";
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
            ${d.issRetido === 1 ? `<ResponsavelRetencao>${d.responsavelRetencao}</ResponsavelRetencao>` : ""}
            <ItemListaServico>${d.itemListaServico}</ItemListaServico>
            ${this.tag("CodigoCnae", d.prestador.cnae)}
            ${this.tag("CodigoTributacaoMunicipio", d.codigoTributacaoMunicipio)}
            <Discriminacao>${d.discriminacao}</Discriminacao>
            <CodigoMunicipio>${d.codigoMunicipio}</CodigoMunicipio>
            <ExigibilidadeISS>${d.exigibilidadeIss}</ExigibilidadeISS>
          </Servico>
          <Prestador>
            <CpfCnpj><Cnpj>${d.prestador.cnpj}</Cnpj></CpfCnpj>
            <InscricaoMunicipal>${d.prestador.inscricaoMunicipal}</InscricaoMunicipal>
          </Prestador>
          <Tomador>
            <IdentificacaoTomador>
              <CpfCnpj><${cpfCnpjTag}>${cpfCnpj}</${cpfCnpjTag}></CpfCnpj>
            </IdentificacaoTomador>
            ${this.tag("RazaoSocial", d.tomadorRazaoSocial)}
            <Endereco>
              ${this.tag("Endereco", d.tomadorEndereco)}
              ${this.tag("Numero", d.tomadorNumero)}
              ${this.tag("Complemento", d.tomadorComplemento)}
              ${this.tag("Bairro", d.tomadorBairro)}
              ${this.tag("CodigoMunicipio", d.tomadorCodigoMunicipio)}
              ${this.tag("Uf", d.tomadorUf)}
              ${this.tag("Cep", d.tomadorCep.replace(/\D/g, ""))}
            </Endereco>
            <Contato>
              ${this.tag("Telefone", d.tomadorTelefone.replace(/\D/g, ""))}
              ${this.tag("Email", d.tomadorEmail)}
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
    listaRps: string,
    prestador: PrestadorRps
  ): string {
    const lote = `
      <LoteRps versao="2.01" Id="${idLote}">
        <NumeroLote>1</NumeroLote>
        <CpfCnpj><Cnpj>${prestador.cnpj}</Cnpj></CpfCnpj>
        <InscricaoMunicipal>${prestador.inscricaoMunicipal}</InscricaoMunicipal>
        <QuantidadeRps>${quantidadeRps}</QuantidadeRps>
        <ListaRps>${listaRps}</ListaRps>
      </LoteRps>
    `;
    return this.cleanXml(lote);
  }

  /** Envelope ABRASF do envio síncrono (a ser assinado no nível do LoteRps). */
  createEnviarLoteEnvio(loteXml: string): string {
    return this.cleanXml(
      `<EnviarLoteRpsSincronoEnvio xmlns="http://www.abrasf.org.br/nfse.xsd">${loteXml}</EnviarLoteRpsSincronoEnvio>`
    );
  }

  /**
   * Embrulha o envio (já assinado) no envelope SOAP do webservice Fiorilli.
   * Não usa cleanXml: o XML já está assinado e qualquer alteração de espaços
   * invalidaria as assinaturas (digest/canonicalização).
   */
  createEnviarLoteSoap(
    envioXml: string,
    username: string,
    password: string
  ): string {
    return (
      `<?xml version="1.0" encoding="UTF-8"?>` +
      `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.issweb.fiorilli.com.br/" xmlns:xd="http://www.w3.org/2000/09/xmldsig#">` +
      `<soapenv:Header/>` +
      `<soapenv:Body>` +
      `<ws:recepcionarLoteRpsSincrono>` +
      envioXml +
      `<username>${username}</username>` +
      `<password>${password}</password>` +
      `</ws:recepcionarLoteRpsSincrono>` +
      `</soapenv:Body>` +
      `</soapenv:Envelope>`
    );
  }

  createConsultaNfseRpsEnvio(
    numero: string | number,
    serie: string,
    tipo: string,
    prestador: PrestadorRps
  ): string {
    const dados = `<IdentificacaoRps><Numero>${numero}</Numero><Serie>${serie}</Serie><Tipo>${tipo}</Tipo></IdentificacaoRps><Prestador><CpfCnpj><Cnpj>${prestador.cnpj}</Cnpj></CpfCnpj><InscricaoMunicipal>${prestador.inscricaoMunicipal}</InscricaoMunicipal></Prestador>`;
    return `<ConsultarNfseRpsEnvio xmlns="http://www.abrasf.org.br/nfse.xsd">${dados}</ConsultarNfseRpsEnvio>`;
  }

  createConsultaNfseSoap(
    envioXml: string,
    username: string,
    password: string
  ): string {
    return this.cleanXml(`<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.issweb.fiorilli.com.br/" xmlns:xd="http://www.w3.org/2000/09/xmldsig#"><soapenv:Header/><soapenv:Body><ws:consultarNfsePorRps>${envioXml}<username>${username}</username><password>${password}</password></ws:consultarNfsePorRps></soapenv:Body></soapenv:Envelope>`);
  }

  /** Consulta de NFS-e emitidas pelo prestador, por período (paginada). */
  createConsultarServicoPrestadoEnvio(
    prestador: PrestadorRps,
    dataInicial: string,
    dataFinal: string,
    pagina: number
  ): string {
    return this.cleanXml(
      `<ConsultarNfseServicoPrestadoEnvio xmlns="http://www.abrasf.org.br/nfse.xsd">` +
        `<Prestador><CpfCnpj><Cnpj>${prestador.cnpj}</Cnpj></CpfCnpj><InscricaoMunicipal>${prestador.inscricaoMunicipal}</InscricaoMunicipal></Prestador>` +
        `<PeriodoEmissao><DataInicial>${dataInicial}</DataInicial><DataFinal>${dataFinal}</DataFinal></PeriodoEmissao>` +
        `<Pagina>${pagina}</Pagina>` +
        `</ConsultarNfseServicoPrestadoEnvio>`
    );
  }

  createConsultarServicoPrestadoSoap(
    envioXml: string,
    username: string,
    password: string
  ): string {
    return this.cleanXml(
      `<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.issweb.fiorilli.com.br/"><soapenv:Header/><soapenv:Body><ws:consultarNfseServicoPrestado>${envioXml}<username>${username}</username><password>${password}</password></ws:consultarNfseServicoPrestado></soapenv:Body></soapenv:Envelope>`
    );
  }

  /**
   * Consulta de NFS-e por faixa de número (paginada). NumeroNfseFinal é opcional
   * (omitido quando <= 0) — informar um número final inexistente dispara E323.
   */
  createConsultarFaixaEnvio(
    prestador: PrestadorRps,
    numeroInicial: number,
    numeroFinal: number,
    pagina: number
  ): string {
    const faixaFinal =
      numeroFinal > 0 ? `<NumeroNfseFinal>${numeroFinal}</NumeroNfseFinal>` : "";
    return this.cleanXml(
      `<ConsultarNfseFaixaEnvio xmlns="http://www.abrasf.org.br/nfse.xsd">` +
        `<Prestador><CpfCnpj><Cnpj>${prestador.cnpj}</Cnpj></CpfCnpj><InscricaoMunicipal>${prestador.inscricaoMunicipal}</InscricaoMunicipal></Prestador>` +
        `<Faixa><NumeroNfseInicial>${numeroInicial}</NumeroNfseInicial>${faixaFinal}</Faixa>` +
        `<Pagina>${pagina}</Pagina>` +
        `</ConsultarNfseFaixaEnvio>`
    );
  }

  createConsultarFaixaSoap(
    envioXml: string,
    username: string,
    password: string
  ): string {
    return this.cleanXml(
      `<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.issweb.fiorilli.com.br/"><soapenv:Header/><soapenv:Body><ws:consultarNfsePorFaixa>${envioXml}<username>${username}</username><password>${password}</password></ws:consultarNfsePorFaixa></soapenv:Body></soapenv:Envelope>`
    );
  }
}
