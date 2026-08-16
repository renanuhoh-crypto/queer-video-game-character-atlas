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
