import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddCodigoExternoCliente1750000000005
  implements MigrationInterface
{
  name = "AddCodigoExternoCliente1750000000005";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("clientes");
    if (table && !table.findColumnByName("codigo_externo")) {
      await queryRunner.addColumn(
        "clientes",
        new TableColumn({
          name: "codigo_externo",
          type: "varchar",
          length: "40",
          isNullable: true,
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("clientes");
    if (table && table.findColumnByName("codigo_externo")) {
      await queryRunner.dropColumn("clientes", "codigo_externo");
    }
  }
}
