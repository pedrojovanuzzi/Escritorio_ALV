import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

/**
 * Garante que o database exista antes de conectar via TypeORM.
 * Conecta no servidor MySQL (sem selecionar um database) e roda
 * CREATE DATABASE IF NOT EXISTS.
 */
export async function ensureDatabase() {
  const database = process.env.DATABASE;
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT) || 3306,
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
  });

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await connection.end();
  console.log(`🗄️  Database '${database}' pronto.`);
}
