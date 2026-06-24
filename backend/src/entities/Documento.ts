import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

export type TipoDocumento = "NFSE" | "BOLETO";
export type StatusDocumento =
  | "Rascunho"
  | "Autorizada"
  | "Rejeitada"
  | "Em aberto"
  | "Pago"
  | "Vencido"
  | "Cancelada";

@Entity("documentos")
export class Documento {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: "varchar", length: 6 })
  tipo?: TipoDocumento; // NFSE | BOLETO

  @Column({ type: "varchar", length: 20, nullable: true })
  numero?: string;

  @Column({ type: "int", nullable: true })
  cliente_id?: number;

  @Column({ type: "varchar", length: 180, nullable: true })
  cliente_nome?: string;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  valor?: number;

  @Column({ type: "varchar", length: 20, default: "Rascunho" })
  status?: StatusDocumento;

  // Ambiente da emissão da NFS-e: 'homologacao' | 'producao'
  @Column({ type: "varchar", length: 12, nullable: true })
  ambiente?: string;

  @Column({ type: "varchar", length: 16, nullable: true })
  codigo_verificacao?: string; // NFS-e

  @Column({ type: "varchar", length: 60, nullable: true })
  linha_digitavel?: string; // Boleto

  // Payload completo do documento (tomador/pagador, valores, tributos...)
  @Column({ type: "json", nullable: true })
  dados?: any;

  @CreateDateColumn({ type: "timestamp" })
  criado_em?: Date;
}
