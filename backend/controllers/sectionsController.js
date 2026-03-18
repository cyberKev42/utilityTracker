import * as sectionsService from '../services/sectionsService.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isDbUnavailable(error) {
  return error.message === 'Database not configured' || error.message === 'Database unavailable';
}

function handleError(res, error) {
  if (isDbUnavailable(error)) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
}

export async function getAll(req, res) {
  try {
    const includeArchived = req.query.include_archived === 'true';
    const sections = await sectionsService.getAll(req.user.id, { includeArchived });
    res.json(sections);
  } catch (error) {
    handleError(res, error);
  }
}

export async function create(req, res) {
  try {
    const { name, unit, icon } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 100) {
      return res.status(400).json({ error: 'Required fields: name, unit' });
    }
    if (!unit || typeof unit !== 'string' || unit.trim().length === 0 || unit.trim().length > 20) {
      return res.status(400).json({ error: 'Required fields: name, unit' });
    }
    if (icon !== undefined && (typeof icon !== 'string' || icon.length > 50)) {
      return res.status(400).json({ error: 'icon must be a string with max 50 characters' });
    }

    const section = await sectionsService.create(req.user.id, {
      name: name.trim(),
      unit: unit.trim(),
      icon: icon ? icon.trim() : null,
    });

    res.status(201).json(section);
  } catch (error) {
    handleError(res, error);
  }
}

export async function update(req, res) {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ error: 'Invalid section ID' });
    }

    const { name, unit, icon } = req.body;
    if (name === undefined && unit === undefined && icon === undefined) {
      return res.status(400).json({ error: 'At least one of name, unit, or icon must be provided' });
    }

    const section = await sectionsService.update(req.user.id, id, { name, unit, icon });
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    res.json(section);
  } catch (error) {
    handleError(res, error);
  }
}

export async function remove(req, res) {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ error: 'Invalid section ID' });
    }

    const deleted = await sectionsService.remove(req.user.id, id);
    if (!deleted) {
      return res.status(404).json({ error: 'Section not found' });
    }

    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
}

export async function archive(req, res) {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ error: 'Invalid section ID' });
    }

    const section = await sectionsService.archive(req.user.id, id);
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    res.json(section);
  } catch (error) {
    handleError(res, error);
  }
}

export async function unarchive(req, res) {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ error: 'Invalid section ID' });
    }

    const section = await sectionsService.unarchive(req.user.id, id);
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    res.json(section);
  } catch (error) {
    handleError(res, error);
  }
}

export async function reorder(req, res) {
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) {
      return res.status(400).json({ error: 'order must be an array of section IDs' });
    }
    if (order.some((id) => !UUID_REGEX.test(id))) {
      return res.status(400).json({ error: 'All items in order must be valid UUIDs' });
    }

    await sectionsService.reorder(req.user.id, order);
    res.json({ success: true });
  } catch (error) {
    handleError(res, error);
  }
}

export async function createMeter(req, res) {
  try {
    const { id: sectionId } = req.params;
    if (!UUID_REGEX.test(sectionId)) {
      return res.status(400).json({ error: 'Invalid section ID' });
    }

    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 100) {
      return res.status(400).json({ error: 'name is required (1-100 characters)' });
    }

    const meter = await sectionsService.createMeter(req.user.id, sectionId, { name: name.trim() });
    if (!meter) {
      return res.status(404).json({ error: 'Section not found' });
    }

    res.status(201).json(meter);
  } catch (error) {
    handleError(res, error);
  }
}

export async function updateMeter(req, res) {
  try {
    const { meterId } = req.params;
    if (!UUID_REGEX.test(meterId)) {
      return res.status(400).json({ error: 'Invalid meter ID' });
    }

    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'name is required' });
    }

    const meter = await sectionsService.updateMeter(req.user.id, meterId, { name: name.trim() });
    if (!meter) {
      return res.status(404).json({ error: 'Meter not found' });
    }

    res.json(meter);
  } catch (error) {
    handleError(res, error);
  }
}

export async function removeMeter(req, res) {
  try {
    const { meterId } = req.params;
    if (!UUID_REGEX.test(meterId)) {
      return res.status(400).json({ error: 'Invalid meter ID' });
    }

    const deleted = await sectionsService.removeMeter(req.user.id, meterId);
    if (!deleted) {
      return res.status(404).json({ error: 'Meter not found' });
    }

    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
}

export async function reorderMeters(req, res) {
  try {
    const { id: sectionId } = req.params;
    if (!UUID_REGEX.test(sectionId)) {
      return res.status(400).json({ error: 'Invalid section ID' });
    }

    const { order } = req.body;
    if (!Array.isArray(order)) {
      return res.status(400).json({ error: 'order must be an array of meter IDs' });
    }
    if (order.some((id) => !UUID_REGEX.test(id))) {
      return res.status(400).json({ error: 'All items in order must be valid UUIDs' });
    }

    await sectionsService.reorderMeters(req.user.id, sectionId, order);
    res.json({ success: true });
  } catch (error) {
    handleError(res, error);
  }
}

export async function getLastReading(req, res) {
  try {
    const { meterId } = req.params;
    if (!UUID_REGEX.test(meterId)) {
      return res.status(400).json({ error: 'Invalid meter ID' });
    }

    const entry = await sectionsService.getLastReading(req.user.id, meterId);
    if (!entry) {
      return res.status(404).json({ error: 'No entries found for this meter' });
    }

    res.json(entry);
  } catch (error) {
    handleError(res, error);
  }
}
