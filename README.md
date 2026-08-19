# Livro Archive

Books, stationery & everything in between — an e-commerce platform built with
Next.js 15, Supabase (Edge Functions only, per `SUPABASE RULE.txt`), Paystack, GSAP and
Three.js.

Read `design.md`, `flow.md` and `memory.md` before touching this project — they carry
the standing rules and decisions this build follows.

## Local development

```bash
npm install
npm run dev
```

## Deploying database changes

```bash
supabase db push
```

## Deploying an Edge Function

```bash
supabase functions deploy <name> --no-verify-jwt
```

## Required environment variables

See `.env.example`. `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` still need to be
supplied and set as Supabase secrets (`supabase secrets set PAYSTACK_SECRET_KEY=...`)
before checkout can actually process a payment.

## Progress

See `dashboard/index.html` (open directly in a browser, no server needed) for a live
build log.
