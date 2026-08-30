# Pantry

A recipe library for two. Paste a link, pull the photo, ingredients, servings, and method, then scale amounts, tick off a cook, and keep the ones that earned a place.

## What you can do

- **Sign in with Google** so the library belongs to you. Your partner signs in too and joins with a kitchen code.
- **Add from a link** — the photo comes with the page. Replace it with a photo you upload.
- **Keepers and wishlist** — split “we make this” from “we want to try this”.
- **Notes** — write what you changed from the original.
- **Checklists** — tick ingredients and steps. When everything is checked, that counts as a cook.
- **Kitchen hits** — recipes ranked by how many times you cooked them.
- **Search the pantry** — type what is in the fridge and find the best saved match.

The first sign-in seeds four sample recipes so you can try the shelves immediately.

## Run it

You need [Node.js](https://nodejs.org/) 20 or newer and a [Supabase](https://supabase.com/) project.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://127.0.0.1:43147](http://127.0.0.1:43147).

### 1. Create the Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Copy **Project URL** and **anon public** key into `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

3. In the Supabase SQL editor, run the migration file:

`supabase/migrations/20260330120000_init.sql`

### 2. Google login (via Supabase Auth)

1. In Supabase: **Authentication → Providers → Google** — enable it.
2. Create (or reuse) an OAuth client in [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
3. Set the Google authorized redirect URI to:

`https://YOUR_PROJECT.supabase.co/auth/v1/callback`

4. Paste the Google Client ID and Client Secret into the Supabase Google provider settings.
5. In Supabase **Authentication → URL configuration**:

- Site URL: `http://127.0.0.1:43147`
- Redirect URLs: `http://127.0.0.1:43147/auth/callback` (and your production URL later)

## Deploy

This is a Next.js app and can go on Vercel. Add the same Supabase env vars there, and add your production URL to Supabase redirect allow-lists and Google OAuth if needed.
