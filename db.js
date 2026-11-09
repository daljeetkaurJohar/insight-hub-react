// Database connection. The same code works with Oracle, SQL Server and MySQL,
// because Knex translates each query into the right SQL dialect.
const knexLib = require('knex');
const config = require('./config');

function connectionSettings(withDatabase = true) {
  const c = config.db;
  if (c.client === 'oracle') {
    // "Thin" mode: no Oracle Client software needs to be installed on the PC.
    return {
      user: c.user,
      password: c.password,
      connectString: `${c.host}:${c.port || 1521}/${c.service}`,
      fetchAsString: ['clob'], // long text (CLOB) comes back as normal text
    };
  }
  if (c.client === 'mssql') {
    return {
      server: c.host,
      port: c.port || 1433,
      user: c.user,
      password: c.password,
      ...(withDatabase ? { database: c.name } : {}),
      options: { encrypt: c.encrypt, trustServerCertificate: !c.encrypt },
    };
  }
  return {
    host: c.host,
    port: c.port || 3306,
    user: c.user,
    password: c.password,
    ...(withDatabase ? { database: c.name } : {}),
    charset: 'utf8mb4', // stores emoji and every language correctly
    dateStrings: true, // return DATE columns as "YYYY-MM-DD", no time-zone shifts
  };
}

// Oracle keeps unquoted names in CAPITALS (T_IH_ENTRIES.TITLE). The app's code uses
// lowercase names, so for Oracle every name is sent in capitals and every result
// comes back in lowercase.
function isPlainObject(v) {
  return v !== null && typeof v === 'object' && (v.constructor === Object || Object.getPrototypeOf(v) === null);
}
function lowerKeys(result) {
  if (Array.isArray(result)) return result.map(lowerKeys);
  if (!isPlainObject(result)) return result;
  const out = {};
  for (const [k, v] of Object.entries(result)) out[k.toLowerCase()] = v;
  return out;
}

const DRIVER = { oracle: 'oracledb', mssql: 'mssql', mysql: 'mysql2' };

// Oracle "Thick" mode: uses Oracle Instant Client, which understands older
// password formats (fixes NJS-116). Turned on by ORACLE_CLIENT_DIR in .env.
if (config.db.client === 'oracle' && config.db.oracleClientDir) {
  try {
    require('oracledb').initOracleClient({ libDir: config.db.oracleClientDir });
    console.log(`Oracle Instant Client loaded from ${config.db.oracleClientDir}`);
  } catch (err) {
    throw new Error(
      `Could not load Oracle Instant Client from "${config.db.oracleClientDir}".\n` +
      '  Check ORACLE_CLIENT_DIR in backend\\.env points to the folder that contains oci.dll.\n  ' + err.message
    );
  }
}

function makeKnex(withDatabase = true) {
  const settings = {
    client: DRIVER[config.db.client],
    connection: connectionSettings(withDatabase),
    pool: { min: 0, max: 10 },
  };
  if (config.db.client === 'oracle') {
    settings.wrapIdentifier = (value, origImpl) => origImpl(value === '*' ? value : value.toUpperCase());
    settings.postProcessResponse = (result) => lowerKeys(result);
  }
  return knexLib(settings);
}

const knex = makeKnex(true);

module.exports = { knex, makeKnex };
