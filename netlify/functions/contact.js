const nodemailer = require('nodemailer');

// ── Contact details (single source of truth) ────────────────────────────────
const FIRM = {
  name: 'Kothari & Associates',
  tagline: 'Tax Advocates',
  phone: '+91 99794 34322',
  email: 'legal@kothariadvisors.com',
  address: '82, Khadayata Boarding Society, Opp. Bus Stand, Modasa - 383315, Gujarat, India',
};

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

// ── Response helper ─────────────────────────────────────────────────────────
function respond(statusCode, data) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
    body: JSON.stringify(data),
  };
}

// ── Netlify Function handler ────────────────────────────────────────────────
exports.handler = async (event) => {
  // Handle preflight CORS request
  if (event.httpMethod === 'OPTIONS') {
    return respond(204, {});
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return respond(405, { message: 'Method not allowed' });
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return respond(400, { message: 'Invalid request body.' });
  }

  // Honeypot check
  if (body.website) {
    return respond(202, { message: 'Your enquiry has been sent. We will be in touch soon.' });
  }

  const errors = validateContact(body);
  if (errors.length > 0) {
    return respond(400, { message: errors.join(' ') });
  }

  const name = sanitise(body.name);
  const phone = sanitise(body.phone);
  const email = body.email.trim();
  const message = body.message.trim();

  const MAIL_FROM = process.env.MAIL_FROM || FIRM.email;
  const MAIL_TO = process.env.MAIL_TO || 'vraj1012006shah@gmail.com';
  const MAIL_CC = process.env.MAIL_CC || FIRM.email;

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.MAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

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

    return respond(202, { message: 'Your enquiry has been sent. We will be in touch soon.' });
  } catch (err) {
    console.error('Mail delivery failed:', err.message);
    return respond(503, {
      message: `We could not send your enquiry. Please call ${FIRM.phone}.`,
    });
  }
};
