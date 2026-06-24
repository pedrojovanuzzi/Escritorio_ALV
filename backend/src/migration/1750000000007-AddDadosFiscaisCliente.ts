import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddDadosFiscaisCliente1750000000007 implements MigrationInterface {
  name = "AddDadosFiscaisCliente1750000000007";

  private colunas: TableColumn[] = [
    new TableColumn({ name: "inscricao_estadual", type: "varchar", length: "30", isNullable: true }),
    new TableColumn({ name: "cnae", type: "varchar", length: "20", isNullable: true }),
    new TableColumn({ name: "contador", type: "varchar", length: "180", isNullable: true }),
    new TableColumn({ name: "responsavel_legal", type: "varchar", length: "180", isNullable: true }),
    new TableColumn({ name: "natureza_juridica", type: "varchar", length: "180", isNullable: true }),
    new TableColumn({ name: "capital_social", type: "varchar", length: "30", isNullable: true }),
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
