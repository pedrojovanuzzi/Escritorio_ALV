import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddUfToCliente1750000000003 implements MigrationInterface {
  name = "AddUfToCliente1750000000003";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("clientes");
    if (table && !table.findColumnByName("uf")) {
      await queryRunner.addColumn(
        "clientes",
        new TableColumn({
          name: "uf",
          type: "varchar",
          length: "2",
          isNullable: true,
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("clientes");
    if (table && table.findColumnByName("uf")) {
      await queryRunner.dropColumn("clientes", "uf");
    }
  }
}
