# Livro Archive — Email Service

Transactional email transport. Independently deployable (Railway, Render, Fly, a VPS —
anywhere that runs Node 20+); intentionally not part of the Next.js app so it isn't
bound by Vercel's serverless limits.

## Why this exists

Supabase's built-in SMTP is intended for auth mail and is rate-limited on the free
tier, and the project rules exclude third-party ESPs (SendGrid/Mailchimp/Resend). So
order mail goes out over SMTP credentials we own. See `flow.md` §7.

## How it fits

```
order status change
   → notification_events row (durable, retryable)
   → /notifications/dispatch  (pg_cron, every 2 min)
   → /send-email Edge Function  (renders the template)
   → THIS SERVICE  (puts it on SMTP)
```

Retries are *not* handled here — the `notification_events` queue owns that. This
service returns 5xx on failure so the queue retries with backoff.

## Run locally

```bash
npm install
cp .env.example .env   # fill it in
npm run dev
```

## Deploy

1. Deploy this folder anywhere running Node 20+.
2. Set the env vars from `.env.example`.
3. Point Supabase at it:

```bash
supabase secrets set EMAIL_SERVICE_URL=https://your-service.example.com
supabase secrets set EMAIL_SERVICE_TOKEN=<the same token>
```

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness check |
| `POST` | `/send` | `{ to, subject, text, html }` — requires `Authorization: Bearer <EMAIL_SERVICE_TOKEN>` |
