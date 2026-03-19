import * as entriesService from '../services/entriesService.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isDbUnavailable(error) {
  return error.message === 'Database not configured' || error.message === 'Database unavailable';
}

export async function create(req, res) {
  try {
    const { meter_id, start_date, end_date, usage_amount, meter_reading, unit_price } = req.body;

    if (!meter_id || !UUID_REGEX.test(meter_id)) {
      return res.status(400).json({ error: 'meter_id is required and must be a valid UUID' });
    }

    if (!start_date || !DATE_REGEX.test(start_date) || isNaN(new Date(start_date).getTime())) {
      return res.status(400).json({ error: 'start_date is required and must be a valid date in YYYY-MM-DD format' });
    }

    if (!end_date || !DATE_REGEX.test(end_date) || isNaN(new Date(end_date).getTime())) {
      return res.status(400).json({ error: 'end_date is required and must be a valid date in YYYY-MM-DD format' });
    }

    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ error: 'end_date must be greater than or equal to start_date' });
    }

    const hasUsage = usage_amount != null;
    const hasReading = meter_reading != null;

    if (!hasUsage && !hasReading) {
      return res.status(400).json({ error: 'Either usage_amount or meter_reading must be provided' });
    }

    if (hasUsage && hasReading) {
      return res.status(400).json({ error: 'Provide either usage_amount or meter_reading, not both' });
    }

    if (hasUsage && (typeof usage_amount !== 'number' || usage_amount <= 0)) {
      return res.status(400).json({ error: 'usage_amount must be a number greater than 0' });
    }

    if (hasReading && (typeof meter_reading !== 'number' || meter_reading < 0)) {
      return res.status(400).json({ error: 'meter_reading must be a non-negative number' });
    }

    if (unit_price != null && (typeof unit_price !== 'number' || unit_price < 0)) {
      return res.status(400).json({ error: 'unit_price must be a non-negative number' });
    }

    const result = await entriesService.createEntry(req.user.id, {
      meter_id,
      start_date,
      end_date,
      usage_amount,
      meter_reading,
      unit_price,
    });

    res.status(201).json(result);
  } catch (error) {
    if (isDbUnavailable(error)) {
      return res.status(503).json({ error: 'Database unavailable' });
    }
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create entry' });
  }
}

export async function remove(req, res) {
  try {
    const { id } = req.params;

    if (!id || !UUID_REGEX.test(id)) {
      return res.status(400).json({ error: 'A valid entry ID is required' });
    }

    await entriesService.deleteEntry(req.user.id, id);
    res.status(204).end();
  } catch (error) {
    if (isDbUnavailable(error)) {
      return res.status(503).json({ error: 'Database unavailable' });
    }
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to delete entry' });
  }
}

export async function getEntries(req, res) {
  try {
    const { meter_id, section_id, year, month, limit: limitRaw, offset: offsetRaw } = req.query;

    if (meter_id && !UUID_REGEX.test(meter_id)) {
      return res.status(400).json({ error: 'meter_id must be a valid UUID' });
    }

    if (section_id && !UUID_REGEX.test(section_id)) {
      return res.status(400).json({ error: 'section_id must be a valid UUID' });
    }

    const parsedYear = year != null ? parseInt(year, 10) : undefined;
    const parsedMonth = month != null ? parseInt(month, 10) : undefined;

    if (parsedMonth != null && (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12)) {
      return res.status(400).json({ error: 'month must be an integer between 1 and 12' });
    }

    const limit = limitRaw != null ? Math.min(parseInt(limitRaw, 10) || 50, 500) : 50;
    const offset = offsetRaw != null ? parseInt(offsetRaw, 10) || 0 : 0;

    const entries = await entriesService.getEntries(req.user.id, {
      meter_id,
      section_id,
      year: parsedYear,
      month: parsedMonth,
      limit,
      offset,
    });

    res.json(entries);
  } catch (error) {
    if (isDbUnavailable(error)) {
      return res.status(503).json({ error: 'Database unavailable' });
    }
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
}

export async function getTrend(req, res) {
  try {
    const trend = await entriesService.getMonthlyTrend(req.user.id);
    res.json(trend);
  } catch (error) {
    if (isDbUnavailable(error)) {
      return res.status(503).json({ error: 'Database unavailable' });
    }
    res.status(500).json({ error: 'Failed to fetch trend data' });
  }
}

export async function getStats(req, res) {
  try {
    const { year, month } = req.query;

    const parsedYear = year != null ? parseInt(year, 10) : undefined;
    const parsedMonth = month != null ? parseInt(month, 10) : undefined;

    if (parsedMonth != null && (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12)) {
      return res.status(400).json({ error: 'month must be an integer between 1 and 12' });
    }

    const stats = await entriesService.getStats(req.user.id, {
      year: parsedYear,
      month: parsedMonth,
    });

    res.json(stats);
  } catch (error) {
    if (isDbUnavailable(error)) {
      return res.status(503).json({ error: 'Database unavailable' });
    }
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
}
