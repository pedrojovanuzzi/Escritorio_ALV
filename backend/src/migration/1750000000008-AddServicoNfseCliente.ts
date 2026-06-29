import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddServicoNfseCliente1750000000008 implements MigrationInterface {
  name = "AddServicoNfseCliente1750000000008";

  private colunas: TableColumn[] = [
    new TableColumn({ name: "item_lista", type: "varchar", length: "20", isNullable: true }),
    new TableColumn({ name: "aliquota", type: "varchar", length: "10", isNullable: true }),
    new TableColumn({ name: "regime", type: "varchar", length: "60", isNullable: true }),
    new TableColumn({ name: "cod_tributacao_municipio", type: "varchar", length: "30", isNullable: true }),
    new TableColumn({ name: "discriminacao", type: "text", isNullable: true }),
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("clientes");
    if (!table) return;
    for (const col of this.colunas) {
      if (!table.findColumnByName(col.name)) {
        await queryRunner.addColumn("clientes", col);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("clientes");
    if (!table) return;
    for (const col of this.colunas) {
      if (table.findColumnByName(col.name)) {
        await queryRunner.dropColumn("clientes", col.name);
      }
    }
  }
}
