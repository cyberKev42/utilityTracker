import * as authService from '../services/authService.js';

export async function register(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Invalid input' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const result = await authService.registerUser(email.trim().toLowerCase(), password);
    res.status(201).json(result);
  } catch (error) {
    if (error.message?.includes('already been registered') || error.message?.includes('already exists')) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const result = await authService.loginUser(email.trim().toLowerCase(), password);
    res.json(result);
  } catch (error) {
    if (error.message?.includes('Invalid login credentials')) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    res.status(500).json({ error: error.message || 'Login failed' });
  }
}

export async function me(req, res) {
  res.json({ user: { id: req.user.id, email: req.user.email } });
}
