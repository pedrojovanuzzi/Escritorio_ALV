import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class InitSchema1750000000000 implements MigrationInterface {
  name = "InitSchema1750000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ----- users -----
    await queryRunner.createTable(
      new Table({
        name: "users",
        columns: [
          { name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment" },
          { name: "nome", type: "varchar", length: "120" },
          { name: "email", type: "varchar", length: "160", isUnique: true },
          { name: "password", type: "varchar", length: "255" },
          { name: "cargo", type: "varchar", length: "60", default: "'Contador'" },
          { name: "criado_em", type: "timestamp", default: "CURRENT_TIMESTAMP" },
        ],
      }),
      true
    );

    // ----- clientes -----
    await queryRunner.createTable(
      new Table({
        name: "clientes",
        columns: [
          { name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment" },
          { name: "nome", type: "varchar", length: "180" },
          { name: "doc", type: "varchar", length: "18" },
          { name: "tipo", type: "varchar", length: "2", default: "'PJ'" },
          { name: "email", type: "varchar", length: "160", isNullable: true },
          { name: "inscricao_municipal", type: "varchar", length: "30", isNullable: true },
          { name: "endereco", type: "varchar", length: "200", isNullable: true },
          { name: "numero", type: "varchar", length: "20", isNullable: true },
          { name: "bairro", type: "varchar", length: "120", isNullable: true },
          { name: "municipio", type: "varchar", length: "120", isNullable: true },
          { name: "cep", type: "varchar", length: "9", isNullable: true },
          { name: "criado_em", type: "timestamp", default: "CURRENT_TIMESTAMP" },
          { name: "atualizado_em", type: "timestamp", default: "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" },
        ],
      }),
      true
    );

    // ----- documentos -----
    await queryRunner.createTable(
      new Table({
        name: "documentos",
        columns: [
          { name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment" },
          { name: "tipo", type: "varchar", length: "6" },
          { name: "numero", type: "varchar", length: "20", isNullable: true },
          { name: "cliente_id", type: "int", isNullable: true },
          { name: "cliente_nome", type: "varchar", length: "180", isNullable: true },
          { name: "valor", type: "decimal", precision: 12, scale: 2, default: 0 },
          { name: "status", type: "varchar", length: "20", default: "'Rascunho'" },
          { name: "codigo_verificacao", type: "varchar", length: "16", isNullable: true },
          { name: "linha_digitavel", type: "varchar", length: "60", isNullable: true },
          { name: "dados", type: "json", isNullable: true },
          { name: "criado_em", type: "timestamp", default: "CURRENT_TIMESTAMP" },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("documentos", true);
    await queryRunner.dropTable("clientes", true);
    await queryRunner.dropTable("users", true);
  }
}
