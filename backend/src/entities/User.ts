import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: "varchar", length: 120 })
  nome?: string;

  @Column({ type: "varchar", length: 160, unique: true })
  email?: string;

  @Column({ type: "varchar", length: 255, select: false })
  password?: string;

  @Column({ type: "varchar", length: 60, default: "Contador" })
  cargo?: string;

  @CreateDateColumn({ type: "timestamp" })
  criado_em?: Date;
}
