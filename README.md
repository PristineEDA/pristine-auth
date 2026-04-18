# Pristine Auth

Pristine Auth is the shared account and cloud-sync service for the Pristine Electron desktop app.

It provides:
- email/password sign up and sign in
- email OTP verification
- Supabase-backed profile storage
- Supabase Storage avatar uploads
- one-time desktop exchange codes for `pristine://auth/callback`
- allowlist-only cloud sync for desktop settings
- a Next.js frontend that can be deployed to Cloudflare Workers

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui primitives
- Supabase Auth, Postgres, and Storage
- OpenNext Cloudflare adapter

## Local setup

1. Install dependencies.

```bash
pnpm install
```

2. Copy the environment template.

```bash
cp .env.example .env.local
```

3. Fill these values in `.env.local`.

- `NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000`
- `NEXT_PUBLIC_SUPABASE_URL=<your local or hosted Supabase URL>`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your Supabase publishable key>`
- `NEXT_PUBLIC_PRISTINE_DEEP_LINK_BASE=pristine://auth/callback`
- `SUPABASE_SECRET_KEY=<your Supabase secret key>`
- `SUPABASE_SERVICE_ROLE_KEY=<optional legacy fallback>`
- `DESKTOP_EXCHANGE_SECRET=<long random secret used to encrypt desktop handoff payloads>`

4. Start local Supabase and apply the schema.

```bash
supabase start
supabase db reset
```

The migration creates:
- `public.user_profiles`
- `public.user_config_snapshots`
- `public.desktop_exchange_codes`
- the `avatars` storage bucket and policies

5. Start the auth app.

```bash
pnpm dev
```

## Validation commands

Use these commands before deployment.

```bash
pnpm test
pnpm typecheck
pnpm build
```

## Electron integration

The desktop client in the sibling `pristine` repo reads these variables:
- `PRISTINE_AUTH_SERVICE_URL`
- `PRISTINE_SUPABASE_URL`
- `PRISTINE_SUPABASE_PUBLISHABLE_KEY`

Expected values in local development:
- `PRISTINE_AUTH_SERVICE_URL=http://127.0.0.1:3000`
- `PRISTINE_SUPABASE_URL=<same value as NEXT_PUBLIC_SUPABASE_URL>`
- `PRISTINE_SUPABASE_PUBLISHABLE_KEY=<same value as NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY>`

The desktop flow is:
1. The MenuBar avatar opens the system browser on `/login` or `/signup`.
2. The browser signs in against Supabase.
3. The auth service creates a one-time exchange code.
4. The browser redirects to `pristine://auth/callback?code=...`.
5. The Electron main process redeems the code and stores the local desktop session.
6. Allowlisted config keys are pushed and pulled through `/api/desktop/config`.

## Cloud config allowlist

Only these persisted desktop settings are synced:
- `ui.theme`
- `window.closeActionPreference`
- `ui.floatingInfoWindow.visible`
- `editor.fontSize`
- `editor.fontFamily`
- `editor.theme`
- `editor.wordWrap`
- `editor.renderWhitespace`
- `editor.renderControlCharacters`
- `editor.fontLigatures`
- `editor.tabSize`
- `editor.cursorBlinking`
- `editor.smoothScrolling`
- `editor.scrollBeyondLastLine`
- `editor.foldingStrategy`
- `editor.lineNumbers`
- `editor.minimap.enabled`
- `editor.glyphMargin`
- `editor.guides.bracketPairs`
- `editor.guides.indentation`

## Supabase production checklist

1. Create a Supabase project.
2. Run the SQL migration from `supabase/migrations` against production.
3. Keep email confirmation enabled.
4. In Supabase Auth URL Configuration, set the production Site URL to `https://pristine-auth.maksyuki.workers.dev`.
5. Add the exact redirect URLs below for both local and hosted auth callbacks.

Hosted Redirect URLs to configure:
- `http://127.0.0.1:3000/success`
- `http://127.0.0.1:3000/verify-otp`
- `http://127.0.0.1:3000/login`
- `http://127.0.0.1:3000/signup`
- `https://pristine-auth.maksyuki.workers.dev/login`
- `https://pristine-auth.maksyuki.workers.dev/signup`
- `https://pristine-auth.maksyuki.workers.dev/success`
- `https://pristine-auth.maksyuki.workers.dev/verify-otp`

6. Configure the email confirmation template to match `supabase/templates/confirmation.html`.
7. Confirm the `avatars` bucket is available and writable by authenticated users.

## Cloudflare deployment

`wrangler.jsonc` is already prepared for the Worker named `pristine-auth`.

Before deployment:
1. Log in to Wrangler.
2. Create or confirm the Worker service `pristine-auth`.
3. Set the public variables and secrets in Cloudflare.
4. Point the final URL at `pristine-auth.maksyuki.workers.dev`.
5. Update Supabase Auth settings so the hosted URL is included in the site URL and redirect allowlist.

Configured public Cloudflare vars in `wrangler.jsonc`:
- `NEXT_PUBLIC_SITE_URL=https://pristine-auth.maksyuki.workers.dev`
- `NEXT_PUBLIC_SUPABASE_URL=https://fsuyziugqxslwkaxcakv.supabase.co`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_i5J8TuBBSJYZwep4Blkk1w_VryyHYPc`
- `NEXT_PUBLIC_PRISTINE_DEEP_LINK_BASE=pristine://auth/callback`

Required Cloudflare secrets:
- `SUPABASE_SECRET_KEY`
- `DESKTOP_EXCHANGE_SECRET`

Push the secrets after `pnpm exec wrangler login`:

```bash
pnpm exec wrangler secret put SUPABASE_SECRET_KEY
pnpm exec wrangler secret put DESKTOP_EXCHANGE_SECRET
```

Build and deploy:

```bash
pnpm build:cf
pnpm deploy
```

## Windows note for OpenNext

`pnpm build:cf` is sensitive to the local environment on Windows.

In this workspace, a user-level Yarn Plug'n'Play manifest at `C:\Users\maksy\.pnp.cjs` interferes with the OpenNext bundling step. The repo code, tests, `pnpm build`, and TypeScript checks are green, but the Cloudflare build is most reliable when run from:
- WSL with Node.js and pnpm installed
- CI on Linux
- a Windows shell that is not affected by the user-level PnP manifest

If you hit OpenNext resolution errors on Windows, run the deploy flow from WSL or CI first.
