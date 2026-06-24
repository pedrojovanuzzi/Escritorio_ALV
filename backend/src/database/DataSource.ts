import { DataSource } from "typeorm";
import dotenv from "dotenv";
import path from "path";
import { User } from "../entities/User";
import { Cliente } from "../entities/Cliente";
import { Documento } from "../entities/Documento";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT) || 3306,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
  entities: [User, Cliente, Documento],
  migrations: [
    path.join(__dirname, "../migration/*.{ts,js}").replace(/\\/g, "/"),
  ],
  // Schema gerenciado por migrations (npm run migration:run).
  synchronize: false,
  logging: false,
});

export default AppDataSource;
