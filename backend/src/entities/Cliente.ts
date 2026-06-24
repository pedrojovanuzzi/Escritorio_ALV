import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export type TipoPessoa = "PF" | "PJ";

@Entity("clientes")
export class Cliente {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: "varchar", length: 180 })
  nome?: string;

  @Column({ type: "varchar", length: 18 })
  doc?: string; // CPF ou CNPJ

  @Column({ type: "varchar", length: 2, default: "PJ" })
  tipo?: TipoPessoa;

  @Column({ type: "varchar", length: 160, nullable: true })
  email?: string;

  @Column({ type: "varchar", length: 30, nullable: true })
  inscricao_municipal?: string;

  @Column({ type: "varchar", length: 200, nullable: true })
  endereco?: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  numero?: string;

  @Column({ type: "varchar", length: 120, nullable: true })
  bairro?: string;

  @Column({ type: "varchar", length: 120, nullable: true })
  municipio?: string;

  @Column({ type: "varchar", length: 9, nullable: true })
  cep?: string;

  @CreateDateColumn({ type: "timestamp" })
  criado_em?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  atualizado_em?: Date;
}
