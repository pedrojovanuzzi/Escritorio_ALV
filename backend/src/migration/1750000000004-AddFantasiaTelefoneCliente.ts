import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddFantasiaTelefoneCliente1750000000004
  implements MigrationInterface
{
  name = "AddFantasiaTelefoneCliente1750000000004";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("clientes");
    if (table && !table.findColumnByName("nome_fantasia")) {
      await queryRunner.addColumn(
        "clientes",
        new TableColumn({
          name: "nome_fantasia",
          type: "varchar",
          length: "180",
          isNullable: true,
        })
      );
    }
    if (table && !table.findColumnByName("telefone")) {
      await queryRunner.addColumn(
        "clientes",
        new TableColumn({
          name: "telefone",
          type: "varchar",
          length: "20",
          isNullable: true,
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("clientes");
    if (table && table.findColumnByName("telefone"))
      await queryRunner.dropColumn("clientes", "telefone");
    if (table && table.findColumnByName("nome_fantasia"))
      await queryRunner.dropColumn("clientes", "nome_fantasia");
  }
}
