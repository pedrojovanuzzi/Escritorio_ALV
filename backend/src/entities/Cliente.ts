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

  // Código do cliente no sistema de origem (vindo das importações de TXT).
  // Usado como chave para casar reimportações e detectar mudanças.
  @Column({ type: "varchar", length: 40, nullable: true })
  codigo_externo?: string;

  @Column({ type: "varchar", length: 180 })
  nome?: string;

  @Column({ type: "varchar", length: 180, nullable: true })
  nome_fantasia?: string;

  @Column({ type: "varchar", length: 18 })
  doc?: string; // CPF ou CNPJ

  @Column({ type: "varchar", length: 20, nullable: true })
  telefone?: string;

  @Column({ type: "varchar", length: 2, default: "PJ" })
  tipo?: TipoPessoa;

  @Column({ type: "varchar", length: 160, nullable: true })
  email?: string;

  @Column({ type: "varchar", length: 30, nullable: true })
  inscricao_municipal?: string;

  @Column({ type: "varchar", length: 30, nullable: true })
  inscricao_estadual?: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  cnae?: string;

  @Column({ type: "varchar", length: 180, nullable: true })
  contador?: string;

  @Column({ type: "varchar", length: 180, nullable: true })
  responsavel_legal?: string;

  @Column({ type: "varchar", length: 180, nullable: true })
  natureza_juridica?: string;

  @Column({ type: "varchar", length: 30, nullable: true })
  capital_social?: string;

  @Column({ type: "varchar", length: 200, nullable: true })
  endereco?: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  numero?: string;

  @Column({ type: "varchar", length: 120, nullable: true })
  complemento?: string;

  @Column({ type: "varchar", length: 120, nullable: true })
  bairro?: string;

  @Column({ type: "varchar", length: 120, nullable: true })
  municipio?: string;

  @Column({ type: "varchar", length: 2, nullable: true })
  uf?: string;

  @Column({ type: "varchar", length: 9, nullable: true })
  cep?: string;

  @CreateDateColumn({ type: "timestamp" })
  criado_em?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  atualizado_em?: Date;
}
