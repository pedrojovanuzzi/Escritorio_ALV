import "reflect-metadata";
import bcrypt from "bcrypt";
import AppDataSource from "../database/DataSource";
import { ensureDatabase } from "../database/ensureDatabase";
import { User } from "../entities/User";
import { Cliente } from "../entities/Cliente";

/**
 * Popula o banco com o usuário contador e os clientes de exemplo do design.
 * Rode com:  npm run seed  (depois de npm run migration:run)
 */
async function seed() {
  await ensureDatabase();
  await AppDataSource.initialize();
  console.log("✅ Conectado ao banco. Populando dados...");

  const userRepo = AppDataSource.getRepository(User);
  const clienteRepo = AppDataSource.getRepository(Cliente);

  // ----- Usuário contador -----
  const email = "contador@alvoradacontabil.com.br";
  let user = await userRepo.findOne({ where: { email } });
  if (!user) {
    user = userRepo.create({
      nome: "Ricardo Camargo",
      email,
      cargo: "Contador responsável",
      password: await bcrypt.hash("123456789", 10),
    });
    await userRepo.save(user);
    console.log(`👤 Usuário criado: ${email} / senha: 123456789`);
  } else {
    console.log("👤 Usuário já existe, pulando.");
  }

  // ----- Clientes de exemplo -----
  const clientes: Partial<Cliente>[] = [
    {
      nome: "WIP TELECOM MULTIMIDIA LTDA",
      doc: "20.843.290/0001-42",
      tipo: "PJ",
      email: "fiscal@wiptelecom.com.br",
      inscricao_municipal: "2195-00/14",
      endereco: "Rua Emílio Carraro",
      numero: "945",
      bairro: "Altos da Cidade",
      municipio: "Bauru",
      cep: "17160-294",
    },
    {
      nome: "Maria de Cássia Carraro Giatti",
      doc: "145.833.158-05",
      tipo: "PF",
      email: "cassia-carraro@hotmail.com",
      endereco: "Avenida Prefeito Adelino Mendonça",
      numero: "184",
      bairro: "Centro",
      municipio: "Bauru",
      cep: "17160-031",
    },
    {
      nome: "Construtora Horizonte Azul Ltda",
      doc: "31.502.118/0001-09",
      tipo: "PJ",
      email: "contato@horizonteazul.com.br",
      inscricao_municipal: "4821-00/02",
      endereco: "Rua das Acácias",
      numero: "1200",
      bairro: "Jardim Aurora",
      municipio: "Marília",
      cep: "17510-200",
    },
    {
      nome: "Padaria Pão Dourado ME",
      doc: "42.118.776/0001-55",
      tipo: "PJ",
      email: "paodourado@gmail.com",
      inscricao_municipal: "3310-00/07",
      endereco: "Rua XV de Novembro",
      numero: "76",
      bairro: "Vila Nova",
      municipio: "Bauru",
      cep: "17012-100",
    },
    {
      nome: "João Pedro Almeida Santos",
      doc: "388.214.659-72",
      tipo: "PF",
      email: "joao.almeida@outlook.com",
      endereco: "Rua Sete de Setembro",
      numero: "410",
      bairro: "Centro",
      municipio: "Jaú",
      cep: "17201-040",
    },
    {
      nome: "Auto Peças Veloz Eireli",
      doc: "28.667.443/0001-18",
      tipo: "PJ",
      email: "financeiro@velozpecas.com",
      inscricao_municipal: "2890-00/11",
      endereco: "Avenida Nações Unidas",
      numero: "2350",
      bairro: "Jardim Europa",
      municipio: "Bauru",
      cep: "17021-330",
    },
  ];

  for (const c of clientes) {
    const existe = await clienteRepo.findOne({ where: { doc: c.doc } });
    if (!existe) {
      await clienteRepo.save(clienteRepo.create(c));
      console.log(`🏢 Cliente criado: ${c.nome}`);
    }
  }

  console.log("🌱 Seed concluído.");
  await AppDataSource.destroy();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Erro no seed:", err);
  process.exit(1);
});
