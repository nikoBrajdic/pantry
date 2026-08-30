# Receptoteka

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

You need [Node.js](https://nodejs.org/) 20 or newer.

```bash
cp .env.example .env.local
# add AUTH_SECRET (any long random string)
npm install
npm run dev
```

Open [http://127.0.0.1:43147](http://127.0.0.1:43147).

## Google login

Create an OAuth client in [Google Cloud Console](https://console.cloud.google.com/apis/credentials). Add these authorized redirect URIs:

- `http://127.0.0.1:43147/api/auth/callback/google`
- `https://YOUR_DOMAIN/api/auth/callback/google`

Then set:

```
AUTH_SECRET=
AUTH_URL=http://127.0.0.1:43147
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
```

Until those keys are set, the sign-in page asks for the Google email you use at home so you can still open the app.

## Deploy

This is a Next.js app and can go on Vercel. Add the same environment variables there. Recipe files live on the server disk in this project; on Vercel that storage is not permanent, so a later database would be the next step for a long-lived shared kitchen.
