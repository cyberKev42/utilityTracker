import * as entriesService from '../services/entriesService.js';

const VALID_TYPES = ['electricity', 'water', 'fuel'];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function create(req, res) {
  try {
    const { type, usage_amount, cost_amount, unit, date } = req.body;

    if (!type || usage_amount == null || cost_amount == null || !unit || !date) {
      return res.status(400).json({
        error: 'All fields are required: type, usage_amount, cost_amount, unit, date',
      });
    }

    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({
        error: `Type must be one of: ${VALID_TYPES.join(', ')}`,
      });
    }

    if (typeof usage_amount !== 'number' || usage_amount < 0) {
      return res.status(400).json({ error: 'usage_amount must be a non-negative number' });
    }

    if (typeof cost_amount !== 'number' || cost_amount < 0) {
      return res.status(400).json({ error: 'cost_amount must be a non-negative number' });
    }

    if (typeof unit !== 'string' || unit.trim().length === 0) {
      return res.status(400).json({ error: 'unit must be a non-empty string' });
    }

    if (!DATE_REGEX.test(date) || isNaN(new Date(date).getTime())) {
      return res.status(400).json({ error: 'date must be a valid date in YYYY-MM-DD format' });
    }

    const entry = await entriesService.createEntry(req.user.id, {
      type,
      usage_amount,
      cost_amount,
      unit: unit.trim(),
      date,
    });

    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to create entry' });
  }
}

export async function getAll(req, res) {
  try {
    const { type, from, to } = req.query;
    const filters = {};

    if (type) {
      if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({
          error: `Invalid type filter. Must be one of: ${VALID_TYPES.join(', ')}`,
        });
      }
      filters.type = type;
    }

    if (from) {
      if (!DATE_REGEX.test(from) || isNaN(new Date(from).getTime())) {
        return res.status(400).json({ error: 'Invalid "from" date. Use YYYY-MM-DD format' });
      }
      filters.from = from;
    }

    if (to) {
      if (!DATE_REGEX.test(to) || isNaN(new Date(to).getTime())) {
        return res.status(400).json({ error: 'Invalid "to" date. Use YYYY-MM-DD format' });
      }
      filters.to = to;
    }

    if (filters.from && filters.to && new Date(filters.from) > new Date(filters.to)) {
      return res.status(400).json({ error: '"from" date must be before or equal to "to" date' });
    }

    const entries = await entriesService.getEntries(req.user.id, filters);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch entries' });
  }
}

export async function remove(req, res) {
  try {
    const { id } = req.params;

    if (!id || !UUID_REGEX.test(id)) {
      return res.status(400).json({ error: 'A valid entry ID is required' });
    }

    await entriesService.deleteEntry(req.user.id, id);
    res.json({ message: 'Entry deleted' });
  } catch (error) {
    if (error.message === 'Entry not found') {
      return res.status(404).json({ error: 'Entry not found' });
    }
    res.status(500).json({ error: error.message || 'Failed to delete entry' });
  }
}

export async function getStats(req, res) {
  try {
    const stats = await entriesService.getStats(req.user.id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch statistics' });
  }
}
