import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddComplementoCliente1750000000006 implements MigrationInterface {
  name = "AddComplementoCliente1750000000006";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("clientes");
    if (table && !table.findColumnByName("complemento")) {
      await queryRunner.addColumn(
        "clientes",
        new TableColumn({
          name: "complemento",
          type: "varchar",
          length: "120",
          isNullable: true,
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("clientes");
    if (table && table.findColumnByName("complemento")) {
      await queryRunner.dropColumn("clientes", "complemento");
    }
  }
}
