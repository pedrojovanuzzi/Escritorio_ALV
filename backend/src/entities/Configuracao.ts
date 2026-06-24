import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from "typeorm";

/**
 * Configurações padrão do sistema (linha única, id=1).
 * Guarda os defaults de NFS-e e Boleto usados para pré-preencher os formulários.
 */
@Entity("configuracoes")
export class Configuracao {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: "json", nullable: true })
  empresa?: any;

  @Column({ type: "json", nullable: true })
  nfse?: any;

  @Column({ type: "json", nullable: true })
  boleto?: any;

  @UpdateDateColumn({ type: "timestamp" })
  atualizado_em?: Date;
}
