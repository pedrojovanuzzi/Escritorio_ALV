import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddEmpresaConfiguracao1750000000008 implements MigrationInterface {
  name = "AddEmpresaConfiguracao1750000000008";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("configuracoes");
    if (table && !table.findColumnByName("empresa")) {
      await queryRunner.addColumn(
        "configuracoes",
        new TableColumn({ name: "empresa", type: "json", isNullable: true })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("configuracoes");
    if (table && table.findColumnByName("empresa")) {
      await queryRunner.dropColumn("configuracoes", "empresa");
    }
  }
}
