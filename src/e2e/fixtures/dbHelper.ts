import mysql from "mysql2/promise";

const DB_CONFIG = {
  host: "127.0.0.1",
  port: 3307,
  user: "root",
  password: "root1234",
  database: "styleup_dev",
};

export async function getConnection() {
  return mysql.createConnection(DB_CONFIG);
}

export async function getVerificationToken(email: string): Promise<string | null> {
  const conn = await getConnection();
  const [rows] = await conn.execute(
    "SELECT verificationToken FROM Local WHERE email = ? LIMIT 1",
    [email],
  );
  await conn.end();
  return (rows as any[]).length > 0 ? (rows as any[])[0].verificationToken : null;
}

export async function verifyLocalByEmail(email: string): Promise<void> {
  const conn = await getConnection();
  await conn.execute(
    "UPDATE Local SET isVerified = true, verificationToken = NULL, verificationTokenExpires = NULL WHERE email = ?",
    [email],
  );
  await conn.end();
}

export async function getLocalIdByEmail(email: string): Promise<string | null> {
  const conn = await getConnection();
  const [rows] = await conn.execute("SELECT id FROM Local WHERE email = ?", [email]);
  await conn.end();
  return (rows as any[]).length > 0 ? (rows as any[])[0].id : null;
}

export async function cleanupTestLocal(email: string): Promise<void> {
  const conn = await getConnection();
  const [locals] = await conn.execute("SELECT id FROM Local WHERE email = ?", [email]);
  if ((locals as any[]).length > 0) {
    const localId = (locals as any[])[0].id;
    await conn.execute(
      "DELETE FROM Payment WHERE appointmentId IN (SELECT id FROM Appointment WHERE localId = ?)",
      [localId],
    );
    await conn.execute("DELETE FROM Report WHERE localId = ?", [localId]);
    await conn.execute("DELETE FROM Appointment WHERE localId = ?", [localId]);
    await conn.execute("DELETE FROM TimeStock WHERE localId = ?", [localId]);
    await conn.execute(
      "DELETE FROM TimeStockTemplate WHERE scheduleTemplateId IN (SELECT id FROM ScheduleTemplate WHERE localId = ?)",
      [localId],
    );
    await conn.execute("DELETE FROM ScheduleTemplate WHERE localId = ?", [localId]);
    await conn.execute("DELETE FROM Employee WHERE localId = ?", [localId]);
    await conn.execute("DELETE FROM Service WHERE localId = ?", [localId]);
    await conn.execute("DELETE FROM Image WHERE localId = ?", [localId]);
    await conn.execute("DELETE FROM SubscriptionHistory WHERE localId = ?", [localId]);
    await conn.execute("DELETE FROM Local WHERE id = ?", [localId]);
  }
  await conn.end();
}
