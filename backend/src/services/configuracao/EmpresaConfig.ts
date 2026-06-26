import AppDataSource from "../../database/DataSource";
import { Configuracao } from "../../entities/Configuracao";
import { EMPRESA_PADRAO, EmpresaConfig } from "../../config/nfse";

/**
 * Retorna os dados da empresa emitente (prestador), mesclando os padrões
 * com o que estiver salvo em Configurações. Usado pela emissão de NFS-e e boleto.
 */
export async function getEmpresa(): Promise<EmpresaConfig> {
  try {
    const repo = AppDataSource.getRepository(Configuracao);
    const cfg = await repo.findOne({ where: { id: 1 } });
    return { ...EMPRESA_PADRAO, ...(cfg?.empresa || {}) };
  } catch {
    return { ...EMPRESA_PADRAO };
  }
}

/** Retorna a configuração de NFS-e salva (inclui credenciais do webservice). */
export async function getNfseConfig(): Promise<Record<string, any>> {
  try {
    const repo = AppDataSource.getRepository(Configuracao);
    const cfg = await repo.findOne({ where: { id: 1 } });
    return (cfg?.nfse as Record<string, any>) || {};
  } catch {
    return {};
  }
}

/** Persiste o próximo número de RPS na configuração de NFS-e. */
export async function setProximoRps(proximo: number): Promise<void> {
  try {
    const repo = AppDataSource.getRepository(Configuracao);
    let cfg = await repo.findOne({ where: { id: 1 } });
    if (!cfg) cfg = repo.create({ id: 1 });
    cfg.nfse = { ...((cfg.nfse as Record<string, any>) || {}), proximo_rps: proximo };
    await repo.save(cfg);
  } catch {
    /* não bloqueia a emissão se falhar ao persistir o contador */
  }
}
