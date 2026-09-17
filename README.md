# Kothari & Associates Website

A Node.js and Express website for **Kothari & Associates — Tax Advocates**, based in Modasa, Gujarat, India.

It serves the static website and delivers contact-form enquiries by email.

## Company Contact Details

| Detail | Value |
| --- | --- |
| **Phone** | +91 99794 34322 |
| **Email** | legal@kothariadvisors.com |
| **Address** | 82, Khadayata Boarding Society, Opp. Bus Stand, Modasa - 383315, Gujarat, India |

## Email behaviour

Each enquiry sends two messages:

- A full enquiry notification to `vraj1012006shah@gmail.com`, with a copy to `legal@kothariadvisors.com` by default.
- An automatic acknowledgement to the visitor's submitted email address.

Both emails include the firm's full contact details (phone, email, address).

Set `MAIL_CC` if another recipient should receive a copy of every enquiry.

## Required deployment variables

| Variable | Value |
| --- | --- |
| `MAIL_HOST` | SMTP host. Defaults to `smtp.gmail.com` |
| `MAIL_PORT` | SMTP port. Defaults to `587` |
| `MAIL_USERNAME` | SMTP mailbox username. Use `legal@kothariadvisors.com` when it is the sending mailbox. |
| `MAIL_PASSWORD` | SMTP password or Gmail App Password. Do not use a normal Google account password. |
| `MAIL_TO` | Main recipient. Defaults to `vraj1012006shah@gmail.com` |
| `MAIL_CC` | Additional recipient(s), comma-separated. Defaults to `legal@kothariadvisors.com` |
| `MAIL_FROM` | Sender address. Defaults to `legal@kothariadvisors.com` |
| `PORT` | Server port. Defaults to `3000` |

For Gmail, turn on two-step verification and create an App Password in the Google Account security settings. Do not place this password in any project file or Git repository.

## Quick start

```bash
npm install
cp .env.example .env   # then fill in your SMTP password
npm start
```

The application is available at `http://localhost:3000`.

## Deploy with Docker

Set the variables above in your host's environment configuration, then build and run:

```bash
docker build -t kothari-associates .
docker run -p 3000:3000 --env-file .env kothari-associates
```

## API endpoints

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/contact` | Submit a contact-form enquiry (JSON body: `name`, `phone`, `email`, `message`) |
| `GET` | `/api/contact-info` | Returns the firm's public contact details as JSON |
