import Surreal from 'surrealdb';

const DEFAULT_TABLES = [
  'MoodEntry',
  'CameraMoodAnalysis',
  'MoodPrediction',
  'ChatConversation',
  'JournalEntry',
  'CrisisAlert',
  'WeeklyReport',
  'JournalAnalysis',
  'Quote',
  'Achievement',
  'UserWellness',
  'User'
];

function sanitizeTableName(table) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(table)) {
    throw new Error(`Invalid table name: ${table}`);
  }
  return table;
}

function normalizeThingId(id) {
  if (typeof id === 'string') return id;
  if (id && typeof id === 'object' && id.tb && id.id) {
    return `${id.tb}:${id.id}`;
  }
  return null;
}

function normalizeRecord(record) {
  if (!record) return null;
  const normalizedId = normalizeThingId(record.id);
  return normalizedId ? { ...record, id: normalizedId } : record;
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value.map(normalizeRecord);
  if (!value) return [];
  return [normalizeRecord(value)];
}

class SurrealAdapter {
  constructor() {
    this.client = new Surreal();
  }

  async init() {
    const url = process.env.SURREALDB_URL || 'http://127.0.0.1:8000/rpc';
    const namespace = process.env.SURREALDB_NS || 'mindful';
    const database = process.env.SURREALDB_DB || 'wellness';
    const user = process.env.SURREALDB_USER || 'root';
    const pass = process.env.SURREALDB_PASS || 'root';

    await this.client.connect(url);
    await this.client.signin({ user, pass });
    await this.client.use({ namespace, database });

    for (const table of DEFAULT_TABLES) {
      await this.ensureTable(table);
    }

    console.log(`✅ SurrealDB connected: ${url} (${namespace}/${database})`);
    return this;
  }

  async ensureTable(table) {
    const safe = sanitizeTableName(table);
    await this.client.query(`DEFINE TABLE ${safe} SCHEMALESS;`);
  }

  async create(table, data) {
    const safe = sanitizeTableName(table);
    await this.ensureTable(safe);
    const payload = {
      ...(data || {}),
      created_at: (data && data.created_at) || new Date().toISOString()
    };
    const result = await this.client.create(safe, payload);
    const rows = normalizeArray(result);
    return rows[0] || null;
  }

  async list(table) {
    const safe = sanitizeTableName(table);
    await this.ensureTable(safe);
    const result = await this.client.select(safe);
    return normalizeArray(result);
  }

  async get(table, id) {
    const safe = sanitizeTableName(table);
    const thing = id.includes(':') ? id : `${safe}:${id}`;
    const result = await this.client.select(thing);
    const rows = normalizeArray(result);
    return rows[0] || null;
  }

  async query(sql, vars = {}) {
    const result = await this.client.query(sql, vars);
    if (!Array.isArray(result)) return [];
    const first = result[0];
    if (!first) return [];
    const rows = first.result;
    if (!rows) return [];
    if (Array.isArray(rows)) return rows.map(normalizeRecord);
    return [normalizeRecord(rows)];
  }

  async merge(id, data) {
    const updated = await this.client.merge(id, {
      ...(data || {}),
      updated_at: new Date().toISOString()
    });
    const rows = normalizeArray(updated);
    return rows[0] || null;
  }

  async update(id, data) {
    return this.merge(id, data);
  }
}

class MemoryAdapter {
  constructor() {
    this.tables = {};
    this.nextId = {};
    for (const table of DEFAULT_TABLES) {
      this.tables[table] = [];
      this.nextId[table] = 1;
    }
  }

  async init() {
    console.warn('⚠️ Using in-memory storage fallback');
    return this;
  }

  async ensureTable(table) {
    const safe = sanitizeTableName(table);
    if (!this.tables[safe]) {
      this.tables[safe] = [];
      this.nextId[safe] = 1;
    }
  }

  async create(table, data) {
    const safe = sanitizeTableName(table);
    await this.ensureTable(safe);
    const id = `${safe.toLowerCase()}:${this.nextId[safe]++}`;
    const row = normalizeRecord({
      id,
      ...(data || {}),
      created_at: (data && data.created_at) || new Date().toISOString()
    });
    this.tables[safe].push(row);
    return row;
  }

  async list(table) {
    const safe = sanitizeTableName(table);
    await this.ensureTable(safe);
    return [...this.tables[safe]];
  }

  async get(table, id) {
    const safe = sanitizeTableName(table);
    await this.ensureTable(safe);
    const thing = id.includes(':') ? id : `${safe}:${id}`;
    return this.tables[safe].find((r) => normalizeThingId(r.id) === thing) || null;
  }

  async query() {
    return [];
  }

  async merge(id, data) {
    const thingId = String(id);
    for (const table of Object.keys(this.tables)) {
      const idx = this.tables[table].findIndex((r) => normalizeThingId(r.id) === thingId);
      if (idx !== -1) {
        const updated = {
          ...this.tables[table][idx],
          ...(data || {}),
          updated_at: new Date().toISOString()
        };
        this.tables[table][idx] = updated;
        return normalizeRecord(updated);
      }
    }
    return null;
  }

  async update(id, data) {
    return this.merge(id, data);
  }
}

let db;
let surrealStatus = {
  connected: false,
  fallback: false,
  lastError: null,
};

export async function initDb() {
  try {
    db = new SurrealAdapter();
    await db.init();
    surrealStatus = {
      connected: true,
      fallback: false,
      lastError: null,
    };
    return db;
  } catch (error) {
    console.error('❌ SurrealDB initialization failed:', error.message);
    db = new MemoryAdapter();
    await db.init();
    surrealStatus = {
      connected: false,
      fallback: true,
      lastError: error?.message || 'Unknown SurrealDB error',
    };
    return db;
  }
}

export function getDb() {
  return db;
}

export function getSurrealStatus() {
  return {
    ...surrealStatus,
    urlConfigured: Boolean(process.env.SURREALDB_URL),
  };
}
