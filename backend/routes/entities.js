import express from 'express';
import { getDb } from '../db.js';

const router = express.Router();

function validateEntityName(entity) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(entity)) {
    const err = new Error(`Invalid entity name: ${entity}`);
    err.statusCode = 400;
    throw err;
  }
}

function applySort(rows, sort) {
  if (!sort || typeof sort !== 'string') return rows;
  const desc = sort.startsWith('-');
  const key = desc ? sort.slice(1) : sort;
  return [...rows].sort((a, b) => {
    const av = a?.[key];
    const bv = b?.[key];
    if (av === bv) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (av > bv) return desc ? -1 : 1;
    return desc ? 1 : -1;
  });
}

router.get('/:entity', async (req, res) => {
  try {
    const { entity } = req.params;
    validateEntityName(entity);
    const { sort = '', limit = '1000' } = req.query;
    const db = getDb();
    const rows = await db.list(entity);
    const sorted = applySort(rows, String(sort));
    const max = Math.max(1, Math.min(5000, parseInt(String(limit), 10) || 1000));
    return res.json({ success: true, data: sorted.slice(0, max) });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:entity', async (req, res) => {
  try {
    const { entity } = req.params;
    validateEntityName(entity);
    const db = getDb();
    const created = await db.create(entity, req.body || {});
    return res.json({ success: true, data: created });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:entity/:id', async (req, res) => {
  try {
    const { entity, id } = req.params;
    validateEntityName(entity);
    const db = getDb();
    const fullId = id.includes(':') ? id : `${entity.toLowerCase()}:${id}`;
    const updated = await db.update(fullId, req.body || {});
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }
    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
