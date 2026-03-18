import * as entriesService from '../services/entriesService.js';

// DEPRECATED: Use GET /api/entries/stats instead. This shim maintains backward compatibility.
export async function getMonthlyBreakdown(req, res) {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const stats = await entriesService.getStats(req.user.id, { year, month });
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get breakdown' });
  }
}

// DEPRECATED: Use GET /api/entries/stats instead. This shim maintains backward compatibility.
export async function getBreakdown(req, res) {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || undefined;
    const stats = await entriesService.getStats(req.user.id, { year, month });
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get breakdown' });
  }
}
