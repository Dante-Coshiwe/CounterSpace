# Counterspace IDE Website

Counterspace is an Angular Blockly learning site with a custom truck simulator, focused tutorials, Supabase Auth, per-user IDE projects, and per-user tutorial progress.

## Supabase setup

1. Create a Supabase project.
2. Open the Supabase SQL editor and run `supabase/schema.sql`.
3. In Supabase, copy the Project URL and public anon key.
4. Copy `.env.example` to `.env` for your notes or deployment tooling.
5. Put the same values into `projects/website/public/env.js`:

```js
window.__env = {
  SUPABASE_URL: 'https://your-project-ref.supabase.co',
  SUPABASE_ANON_KEY: 'your-public-anon-key'
};
```

The public anon key is safe for the browser because Row Level Security keeps users scoped to their own rows.

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:4200/`.

To open it from another phone, tablet, or laptop on the same Wi-Fi:

```bash
npm start -- --host 0.0.0.0 --port 4200
```

Then open `http://YOUR-COMPUTER-IP:4200/` on the other device. On Windows you can find the IP address with `ipconfig`.

## Build

```bash
npm run build
```

Deploy the generated `dist/website` output, and make sure your hosted `env.js` contains the production Supabase URL and anon key.

## What is stored

- `profiles`: one profile per Supabase Auth user.
- `ide_projects`: each user's project name, Blockly XML, generated code, movement command queue, and IDE component metadata.
- `tutorials`: the published tutorial catalogue.
- `tutorial_progress`: each user's completed tutorials and progress percentage.

The old `WEBSITE BACKEND/server.js` Express API has been removed. The app now talks directly to Supabase.
