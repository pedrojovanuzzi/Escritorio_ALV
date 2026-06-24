import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddAmbienteToDocumento1750000000001 implements MigrationInterface {
  name = "AddAmbienteToDocumento1750000000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("documentos");
    if (table && !table.findColumnByName("ambiente")) {
      await queryRunner.addColumn(
        "documentos",
        new TableColumn({
          name: "ambiente",
          type: "varchar",
          length: "12",
          isNullable: true,
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("documentos");
    if (table && table.findColumnByName("ambiente")) {
      await queryRunner.dropColumn("documentos", "ambiente");
    }
  }
}
