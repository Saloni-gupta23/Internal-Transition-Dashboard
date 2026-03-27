const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files (HTML, CSS, JS, assets)
app.use(express.static(path.join(__dirname)));

// ── In-memory session store (demo only) ──
const sessions = new Map();

// Demo credentials (replace with DB lookup in production)
const DEMO_USERS = [
  { empId: 'admin',  password: 'admin123' },
  { empId: 'EMP001', password: 'phoenix2026' }
];

// API – login
app.post('/api/login', (req, res) => {
  const { empId, password } = req.body;
  if (!empId || !password) {
    return res.status(400).json({ error: 'Employee ID and password are required.' });
  }

  const user = DEMO_USERS.find(
    u => u.empId.toLowerCase() === empId.trim().toLowerCase() && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid Employee ID or password.' });
  }

  // Create a session token
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { empId: user.empId, created: Date.now() });

  // Auto-expire after 8 hours
  setTimeout(() => sessions.delete(token), 8 * 60 * 60 * 1000);

  res.json({ ok: true, token, empId: user.empId });
});

// API – check auth
app.get('/api/check-auth', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const token = auth.slice(7);
  const session = sessions.get(token);
  if (!session) {
    return res.status(401).json({ error: 'Session expired' });
  }
  res.json({ ok: true, empId: session.empId });
});

// API – logout
app.post('/api/logout', (req, res) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    sessions.delete(auth.slice(7));
  }
  res.json({ ok: true });
});

// Reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// API – send reset email
app.post('/api/send-reset', async (req, res) => {
  try{
    const { email } = req.body;
    if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
      return res.status(400).json({ error: 'Invalid email' });
    }

    // In a real app, create a one-time token stored server-side:
    // const token = crypto.randomUUID() or crypto.randomBytes(32).toString('hex');
    // save token + email + expiration -> DB
    // For the demo, we’ll just place a placeholder token:
    const token = encodeURIComponent(Buffer.from(`${email}|${Date.now()}`).toString('base64'));
    const resetUrl = `${process.env.RESET_BASE_URL}?token=${token}`;

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#0b1f24">
        <h2 style="color:#007982;margin:0 0 8px">Reset your password</h2>
        <p>We received a request to reset the password for the account associated with <b>${email}</b>.</p>
        <p>Click the button below to set a new password:</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;background:#96BE0D;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px;font-weight:600">
            Reset Password
          </a>
        </p>
        <p style="font-size:13px;color:#3d4d53">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: 'Password Reset',
      html
    });

    res.json({ ok: true });
  }catch(err){
    console.error(err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Auth mail server running on http://localhost:${port}`));
