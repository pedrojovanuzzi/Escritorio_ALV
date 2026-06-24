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
