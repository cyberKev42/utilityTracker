import * as entriesService from '../services/entriesService.js';

const VALID_TYPES = ['electricity', 'water', 'fuel'];

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

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date) || isNaN(new Date(date).getTime())) {
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
    const entries = await entriesService.getEntries(req.user.id);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch entries' });
  }
}

export async function remove(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Entry ID is required' });
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
