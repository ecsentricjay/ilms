const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const supabase = require('../lib/supabase');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { full_name, email, password, role } = req.body;

  if (!full_name || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (!['student', 'lecturer'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Admin accounts are created by system administrators.' });
  }

  try {
    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error('Auth error:', authError);
      return res.status(400).json({ error: authError.message });
    }

    // Step 2: Insert into users table
    const { data: user, error: dbError } = await supabase
      .from('users')
      .insert({ id: authData.user.id, full_name, email, role, is_active: true })
      .select()
      .single();

    if (dbError) {
      console.error('DB error:', dbError);
      // Rollback the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(400).json({ error: dbError.message });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Register exception:', err);
    res.status(500).json({ error: err.message || 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    // Step 1: Sign in via Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('Login auth error:', authError);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Step 2: Fetch user profile
    const { data: user, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (dbError || !user) {
      console.error('Login DB error:', dbError);
      return res.status(401).json({ error: 'User profile not found. Please contact admin.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Your account has been deactivated. Contact admin.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Login exception:', err);
    res.status(500).json({ error: err.message || 'Server error during login' });
  }
});

module.exports = router;
