import "server-only";
import mysql from "mysql2/promise";

// Reuse one pool across hot reloads in dev.
const globalForDb = globalThis as unknown as { pool?: mysql.Pool };

export const pool =
  globalForDb.pool ??
  mysql.createPool({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "gift23",
    charset: "utf8mb4",
    connectionLimit: 10,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;
