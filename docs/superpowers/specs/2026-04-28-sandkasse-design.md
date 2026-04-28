# Sandkasse-prosjekt

**Dato:** 2026-04-28

## Mål

Et enkelt sandkasse-prosjekt for en UX-designer som vil eksperimentere med Figma-til-kode-flyt og backend/database (Supabase). Ingen produksjonsmål — kun et sted å teste og leke.

## Stack

- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS**
- **Supabase** (database via `@supabase/supabase-js`)

## Struktur

```
uxwork/
├── app/
│   ├── layout.tsx
│   └── page.tsx        # Tom startside
├── components/         # Figma-genererte komponenter limes inn her
├── lib/
│   └── supabase.ts     # Delt Supabase-klient
├── .env.local          # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
└── ...
```

## Scope

- Ingen auth
- Ingen forhåndsdefinerte features eller tabeller
- Startside er en blank canvas
- API-routes og Supabase-tabeller legges til etter behov
