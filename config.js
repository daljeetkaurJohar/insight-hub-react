// Reads the settings from the .env file in the backend folder.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const env = process.env;

const config = {
  port: Number(env.PORT || 3001),
  db: {
    client: (env.DB_CLIENT || 'oracle').toLowerCase(),
    host: env.DB_HOST || 'localhost',
    port: env.DB_PORT ? Number(env.DB_PORT) : undefined,
    name: env.DB_NAME || 'GPMS',
    // Oracle only: the service name (ask your DBA) and the schema that owns the tables
    service: env.DB_SERVICE,
    schema: (env.DB_SCHEMA || '').trim(),
    // Oracle only: folder of Oracle Instant Client. Needed for older password formats (error NJS-116).
    oracleClientDir: (env.ORACLE_CLIENT_DIR || '').trim(),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    encrypt: String(env.DB_ENCRYPT || 'false').toLowerCase() === 'true',
  },
  auth: {
    mode: (env.AUTH_MODE || 'entra').toLowerCase(),
    tenantId: env.AZURE_TENANT_ID,
    clientId: env.AZURE_CLIENT_ID,
  },
  // Start of every table name, e.g. T_IH_ -> T_IH_ENTRIES
  tablePrefix: (env.TABLE_PREFIX ?? 'T_IH_').trim(),
  uploadDir: path.resolve(__dirname, '..', env.UPLOAD_DIR || 'uploads'),
  maxImageBytes: Number(env.MAX_IMAGE_MB || 8) * 1024 * 1024,
};

if (!['oracle', 'mssql', 'mysql'].includes(config.db.client)) {
  throw new Error(`DB_CLIENT must be "oracle", "mssql" or "mysql" (got "${config.db.client}")`);
}
if (!['entra', 'dev'].includes(config.auth.mode)) {
  throw new Error(`AUTH_MODE must be "entra" or "dev" (got "${config.auth.mode}")`);
}


if (config.db.schema && !/^[A-Za-z0-9_$#]+$/.test(config.db.schema)) {
  throw new Error('DB_SCHEMA may only contain letters, numbers, _ $ #');
}
if (config.db.client === 'oracle' && !config.db.service) {
  throw new Error('DB_SERVICE (the Oracle service name) is missing in backend/.env');
}
if (!/^[A-Za-z0-9_]*$/.test(config.tablePrefix)) {
  throw new Error('TABLE_PREFIX may only contain letters, numbers and _');
}

module.exports = config;
