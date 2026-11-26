// Database setup/upgrade — runs on every container start (see Dockerfile). Safe to run repeatedly.
//  1. db/schema.sql: creates missing tables + default settings/translations (never overwrites edits)
//  2. upgrades an existing gift23-style database: sub prizes join the shared prize sets
//  3. INITIAL_ADMIN_EMAILS: makes sure these CMU accounts can log in to /admin as admin
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const config = {
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "gift23",
  charset: "utf8mb4",
  multipleStatements: true,
};
const log = (...a) => console.log("[migrate]", ...a);

async function connect() {
  for (let attempt = 1; ; attempt++) {
    try {
      return await mysql.createConnection(config);
    } catch (err) {
      if (attempt >= 15) throw err;
      log(`database not ready (${err.code ?? err.message}), retrying in 2s… (${attempt}/15)`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

const db = await connect();
log(`connected to ${config.host}:${config.port}/${config.database}`);

const tableExists = async (t) => (await db.query("SHOW TABLES LIKE ?", [t]))[0].length > 0;
const columnExists = async (t, c) => (await db.query(`SHOW COLUMNS FROM \`${t}\` LIKE ?`, [c]))[0].length > 0;

// 1. Base schema (CREATE TABLE IF NOT EXISTS …)
const schema = await readFile(fileURLToPath(new URL("../db/schema.sql", import.meta.url)), "utf8");
await db.query(schema);
log("schema ok");

// 2a. Sub prizes get a set number (old PHP databases don't have it)
if (!(await columnExists("gif_sub", "datagroup"))) {
  await db.query("ALTER TABLE gif_sub ADD COLUMN datagroup INT NOT NULL DEFAULT 1 AFTER giftname, ADD KEY idx_datagroup (datagroup)");
  await db.query(`INSERT INTO settings (setting_key, setting_value)
                  SELECT 'live_show_sub_group_1', setting_value FROM settings WHERE setting_key = 'live_show_sub'
                  ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`);
  log("added gif_sub.datagroup (existing sub prizes → set 1)");
}
// 2b. Shared sets: merge the short-lived group_sub table into `group`
if (await tableExists("group_sub")) {
  await db.query("INSERT INTO `group` (datagroup) SELECT gs.datagroup FROM group_sub gs WHERE NOT EXISTS (SELECT 1 FROM `group` g WHERE g.datagroup = gs.datagroup)");
  await db.query("DROP TABLE group_sub");
  log("merged group_sub into group");
}
// 2c. Every set referenced by a prize exists
const [added] = await db.query(`INSERT INTO \`group\` (datagroup)
  SELECT DISTINCT d FROM (SELECT datagroup AS d FROM gif_main UNION SELECT datagroup FROM gif_sub) x
  WHERE NOT EXISTS (SELECT 1 FROM \`group\` g WHERE g.datagroup = x.d)`);
if (added.affectedRows) log(`created ${added.affectedRows} missing set(s)`);

// 3. Bootstrap admins (first login needs at least one allowed account)
const admins = (process.env.INITIAL_ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
for (const email of admins) {
  const [r] = await db.query("INSERT IGNORE INTO backend_users (email, name, role, status) VALUES (?, '', 'admin', 1)", [email]);
  if (r.affectedRows) log(`added admin ${email}`);
}

await db.end();
log("done");
