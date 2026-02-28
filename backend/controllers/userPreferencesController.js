import * as userPreferencesService from '../services/userPreferencesService.js';

const VALID_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'PLN', 'CZK', 'SEK', 'NOK', 'DKK', 'HUF'];

function isDbUnavailable(error) {
  return error.message === 'Database not configured' || error.message === 'Database unavailable';
}

export async function getCurrency(req, res) {
  try {
    const currency = await userPreferencesService.getCurrency(req.user.id);
    res.json({ currency });
  } catch (error) {
    if (isDbUnavailable(error)) {
      return res.status(503).json({ error: 'Database unavailable' });
    }
    res.status(500).json({ error: 'Failed to fetch currency preference' });
  }
}

export async function updateCurrency(req, res) {
  try {
    const { currency } = req.body;

    if (!currency || !VALID_CURRENCIES.includes(currency)) {
      return res.status(400).json({
        error: `Currency must be one of: ${VALID_CURRENCIES.join(', ')}`,
      });
    }

    const result = await userPreferencesService.upsertCurrency(req.user.id, currency);
    res.json(result);
  } catch (error) {
    if (isDbUnavailable(error)) {
      return res.status(503).json({ error: 'Database unavailable' });
    }
    res.status(500).json({ error: 'Failed to update currency preference' });
  }
}
