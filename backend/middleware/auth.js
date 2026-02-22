import { supabase } from '../config/supabase.js';

export async function authenticate(req, res, next) {
  if (!supabase) {
    return res.status(503).json({ error: 'Authentication service not configured' });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Authentication failed' });
  }
}
