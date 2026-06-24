import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateConfiguracoes1750000000002 implements MigrationInterface {
  name = "CreateConfiguracoes1750000000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const existe = await queryRunner.hasTable("configuracoes");
    if (existe) return;

    await queryRunner.createTable(
      new Table({
        name: "configuracoes",
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          { name: "nfse", type: "json", isNullable: true },
          { name: "boleto", type: "json", isNullable: true },
          {
            name: "atualizado_em",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
            onUpdate: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("configuracoes", true);
  }
}
