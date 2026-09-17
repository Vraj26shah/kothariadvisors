require('dotenv').config();

const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files (index.html, styles.css, script.js, assets/)
app.use(express.static(path.join(__dirname), {
  extensions: ['html'],
}));

// ── Mail transport ──────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.MAIL_PORT) || 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 5000,
});

// ── Contact details (single source of truth) ────────────────────────────────
const FIRM = {
  name: 'Kothari & Associates',
  tagline: 'Tax Advocates',
  phone: '+91 99794 34322',
  email: 'legal@kothariadvisors.com',
  address: '82, Khadayata Boarding Society, Opp. Bus Stand, Modasa - 383315, Gujarat, India',
};

const MAIL_FROM = process.env.MAIL_FROM || FIRM.email;
const MAIL_TO = process.env.MAIL_TO || 'vraj1012006shah@gmail.com';
const MAIL_CC = process.env.MAIL_CC || FIRM.email;

// ── Validation helpers ──────────────────────────────────────────────────────
function validateContact(body) {
  const errors = [];
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    errors.push('Name is required.');
  } else if (body.name.trim().length > 100) {
    errors.push('Name must be 100 characters or fewer.');
  }

  if (!body.phone || typeof body.phone !== 'string' || body.phone.trim().length === 0) {
    errors.push('Phone number is required.');
  } else if (body.phone.trim().length > 30) {
    errors.push('Phone number must be 30 characters or fewer.');
  }

  if (!body.email || typeof body.email !== 'string' || body.email.trim().length === 0) {
    errors.push('Email address is required.');
  } else if (body.email.trim().length > 254) {
    errors.push('Email address is too long.');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
    errors.push('Please provide a valid email address.');
  }

  if (!body.message || typeof body.message !== 'string' || body.message.trim().length === 0) {
    errors.push('Message is required.');
  } else if (body.message.trim().length > 3000) {
    errors.push('Message must be 3000 characters or fewer.');
  }

  return errors;
}

// Sanitise user input – strip CR/LF from single-line fields
function sanitise(value) {
  return String(value).replace(/[\r\n]/g, ' ').trim();
}

// ── Rate limiter (5 requests per minute per IP) ─────────────────────────────
const contactLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again in a minute.' },
});

// ── POST /api/contact ───────────────────────────────────────────────────────
app.post('/api/contact', contactLimiter, async (req, res) => {
  // Honeypot check — if a hidden field named "website" is filled, silently reject
  if (req.body.website) {
    return res.status(202).json({ message: 'Your enquiry has been sent. We will be in touch soon.' });
  }

  const errors = validateContact(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ message: errors.join(' ') });
  }

  const name = sanitise(req.body.name);
  const phone = sanitise(req.body.phone);
  const email = req.body.email.trim();
  const message = req.body.message.trim();

  try {
    // 1. Notification to the firm
    const ccList = MAIL_CC.split(',').map(s => s.trim()).filter(Boolean);
    await transporter.sendMail({
      from: { name: `${FIRM.name} Website`, address: MAIL_FROM },
      to: MAIL_TO,
      cc: ccList.length > 0 ? ccList : undefined,
      replyTo: { name, address: email },
      subject: `New website enquiry from ${name}`,
      text: [
        'A new website enquiry has been received.',
        '',
        `Name:    ${name}`,
        `Phone:   ${phone}`,
        `Email:   ${email}`,
        '',
        'Enquiry:',
        message,
        '',
        '---',
        `${FIRM.name} | ${FIRM.tagline}`,
        `${FIRM.address}`,
        `Phone: ${FIRM.phone} | Email: ${FIRM.email}`,
      ].join('\n'),
    });

    // 2. Acknowledgement to the visitor
    await transporter.sendMail({
      from: { name: FIRM.name, address: MAIL_FROM },
      to: email,
      subject: 'We have received your enquiry',
      text: [
        `Dear ${name},`,
        '',
        `Thank you for contacting ${FIRM.name}. We have received your enquiry and our team will review it shortly.`,
        '',
        `For urgent assistance, please call ${FIRM.phone}.`,
        '',
        `You can also visit us at:`,
        `${FIRM.address}`,
        '',
        `${FIRM.name}`,
        `${FIRM.tagline}`,
        `Phone: ${FIRM.phone}`,
        `Email: ${FIRM.email}`,
      ].join('\n'),
    });

    return res.status(202).json({ message: 'Your enquiry has been sent. We will be in touch soon.' });
  } catch (err) {
    console.error('Mail delivery failed:', err.message);
    return res.status(503).json({
      message: `We could not send your enquiry. Please call ${FIRM.phone}.`,
    });
  }
});

// ── GET /api/contact-info  (public company details for any client) ──────────
app.get('/api/contact-info', (_req, res) => {
  res.json({
    firm: FIRM.name,
    tagline: FIRM.tagline,
    phone: FIRM.phone,
    email: FIRM.email,
    address: FIRM.address,
  });
});

// ── Fallback: serve index.html for any unknown route ────────────────────────
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Kothari & Associates server running at http://localhost:${PORT}`);
});
