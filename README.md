# Helena Hair Book 💇‍♀️

Webapp di prenotazione appuntamenti per parrucchieri freelance.

## Stack
- **Frontend**: Next.js 14 + TypeScript
- **Styling**: CSS-in-JS (zero dipendenze UI)
- **Deploy**: Vercel (gratuito)
- **DB** *(prossimo step)*: Supabase
- **Email/SMS** *(prossimo step)*: Brevo

## Avvio locale

```bash
npm install
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000)

## Deploy su Vercel

1. Vai su [vercel.com](https://vercel.com) → Import Git Repository
2. Seleziona `helenahairbook`
3. Clicca Deploy — fatto ✅

## Struttura

```
src/
└── app/
    ├── layout.tsx        # Layout globale + metadata
    ├── page.tsx          # Entry point
    └── HelenaBooking.tsx # Componente principale (3 step)
```
