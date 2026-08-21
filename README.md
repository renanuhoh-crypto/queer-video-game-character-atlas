# Press Q

**AI-Assisted Queer Game Archive**

Press Q is a digital humanities research platform for exploring queer video
game representation through structured data, visual analytics, and a
conversational AI assistant named Quiu.

Planned public domain: `pressq.com`. Deployment and domain configuration are
intentionally unchanged for now.

## Development

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Checks

```bash
npm run lint
npm run build
```

## Data

The Press Q dataset is stored in `src/data/pressq_seed_dataset.csv`. The app
treats it as the source for Quiu and the visual analytics experience.

Game-level affordances such as customizable gender, player-defined characters,
and gender-independent relationship systems are stored separately in
`src/data/game_queer_systems.csv`. See `src/data/METHODOLOGY.md` for the unit and
coverage rules.

## Character administration

The private `/admin` page can add, edit, delete, search, and export character
and queer-system records in separate tabs. Configure a password in `.env.local`
before starting the app:

```dotenv
ADMIN_PASSWORD=use-a-long-unique-password
```

The password is checked on the server. Changes made in the admin page are
written directly to `src/data/pressq_seed_dataset.csv`, so the feature requires
a persistent, writable filesystem. A database should replace file writes before
using the editor on a serverless production deployment.
