const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.get('/discord',
  passport.authenticate('discord')
);

router.get('/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/login' }),
  (req, res) => {
    const token = jwt.sign(
      {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name
      },
      process.env.JWT_SECRET || 'jwt-secret-change-in-production',
      { expiresIn: '7d' }
    );

    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}?discord_login=success&user_name=${encodeURIComponent(req.user.name)}&user_email=${encodeURIComponent(req.user.email)}`);
  }
);

router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    const token = jwt.sign(
      {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name
      },
      process.env.JWT_SECRET || 'jwt-secret-change-in-production',
      { expiresIn: '7d' }
    );

    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}?sso_token=${token}&user_name=${encodeURIComponent(req.user.name)}&user_email=${encodeURIComponent(req.user.email)}`);
  }
);

router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

router.get('/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

router.post('/verify-token', (req, res) => {
  const { token } = req.body;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwt-secret-change-in-production');
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
});

module.exports = router;
