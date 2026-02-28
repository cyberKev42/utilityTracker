import * as settingsService from '../services/settingsService.js';

const VALID_TYPES = ['power', 'water', 'fuel'];

function isDbUnavailable(error) {
  return error.message === 'Database not configured' || error.message === 'Database unavailable';
}

export async function getUnitPrice(req, res) {
  try {
    const { type } = req.params;

    if (!type || !VALID_TYPES.includes(type)) {
      return res.status(400).json({
        error: `Type must be one of: ${VALID_TYPES.join(', ')}`,
      });
    }

    const setting = await settingsService.getUnitPrice(req.user.id, type);
    res.json({ unit_price: setting?.unit_price ?? null });
  } catch (error) {
    if (isDbUnavailable(error)) {
      return res.status(503).json({ error: 'Database unavailable' });
    }
    res.status(500).json({ error: 'Failed to fetch unit price' });
  }
}

export async function updateUnitPrice(req, res) {
  try {
    const { type } = req.params;
    const { unit_price } = req.body;

    if (!type || !VALID_TYPES.includes(type)) {
      return res.status(400).json({
        error: `Type must be one of: ${VALID_TYPES.join(', ')}`,
      });
    }

    if (unit_price == null || typeof unit_price !== 'number' || unit_price < 0) {
      return res.status(400).json({ error: 'unit_price must be a non-negative number' });
    }

    const setting = await settingsService.upsertUnitPrice(req.user.id, type, unit_price);
    res.json(setting);
  } catch (error) {
    if (isDbUnavailable(error)) {
      return res.status(503).json({ error: 'Database unavailable' });
    }
    res.status(500).json({ error: 'Failed to update unit price' });
  }
}
