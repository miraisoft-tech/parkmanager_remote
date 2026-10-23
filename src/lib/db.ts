import mysql from 'mysql2/promise';

declare global {
  // eslint-disable-next-line no-var
  var __pmDbPool: mysql.Pool | undefined;
}

const connectionUrl = process.env.DATABASE_URL || 'mysql://arcticos_admin:5IH0ftn98PtICOS@arcticos.io/arcticos_parkmanager';

export function getDbPool(): mysql.Pool {
  if (!global.__pmDbPool) {
    global.__pmDbPool = mysql.createPool({
      uri: connectionUrl,
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 10,
      idleTimeout: 60000,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }
  return global.__pmDbPool;
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const pool = getDbPool();
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}
