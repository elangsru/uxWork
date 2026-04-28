# Sandkasse Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sett opp et kjørende Next.js 16 + Supabase sandkasse-prosjekt i `/Users/espenlangsrud/github/uxwork`

**Architecture:** Next.js 16 App Router med TypeScript og Tailwind CSS v4. Supabase-klient settes opp som et delt singleton i `lib/supabase.ts`. Startsiden er en blank canvas.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS v4, @supabase/supabase-js

---

## File Structure

```
uxwork/
├── app/
│   ├── layout.tsx          # Root layout med Tailwind
│   ├── page.tsx            # Blank startside
│   └── globals.css         # Tailwind directives
├── components/             # Tom mappe — Figma-komponenter limes inn her
├── lib/
│   └── supabase.ts         # Delt Supabase-klient (browser)
├── docs/
│   └── superpowers/        # Spec og plan (allerede opprettet)
├── .env.local              # Supabase-nøkler (ikke committed)
├── .env.local.example      # Mal for nøkler (committed)
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── tsconfig.json
└── package.json
```

---

### Task 1: Scaffold Next.js-prosjektet

**Files:**
- Create: alle Next.js-filer via `create-next-app`

- [ ] **Step 1: Kjør create-next-app i uxwork-katalogen**

```bash
cd /Users/espenlangsrud/github/uxwork
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --no-import-alias \
  --turbopack
```

Svar `Yes` på alle prompts. Velg `No` på "Would you like to use src/ directory?" og `No` på "Would you like to customize the import alias".

- [ ] **Step 2: Verifiser at prosjektet bygger**

```bash
cd /Users/espenlangsrud/github/uxwork
npm run build
```

Forventet: `✓ Compiled successfully` uten feil.

- [ ] **Step 3: Verifiser at dev-server starter**

```bash
cd /Users/espenlangsrud/github/uxwork
npm run dev &
sleep 3
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
kill %1
```

Forventet: `200`

- [ ] **Step 4: Initialiser git og commit**

```bash
cd /Users/espenlangsrud/github/uxwork
git init
git add .
git commit -m "feat: scaffold Next.js 15 + Tailwind sandkasse"
```

---

### Task 2: Rens startsiden til blank canvas

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Erstatt app/page.tsx med blank canvas**

```tsx
export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">Sandkasse</h1>
    </main>
  );
}
```

- [ ] **Step 2: Rens app/globals.css — behold kun Tailwind-direktiver**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 3: Verifiser i browser**

```bash
cd /Users/espenlangsrud/github/uxwork
npm run dev
```

Åpne `http://localhost:3000` — skal vise "Sandkasse" som overskrift på hvit bakgrunn.

- [ ] **Step 4: Commit**

```bash
cd /Users/espenlangsrud/github/uxwork
git add app/page.tsx app/globals.css
git commit -m "feat: blank canvas startside"
```

---

### Task 3: Installer og konfigurer Supabase

**Files:**
- Create: `lib/supabase.ts`
- Create: `.env.local.example`
- Modify: `.gitignore` (verifiser at .env.local er ignorert)

- [ ] **Step 1: Installer Supabase-klient**

```bash
cd /Users/espenlangsrud/github/uxwork
npm install @supabase/supabase-js
```

Forventet: `added N packages` uten feil.

- [ ] **Step 2: Opprett lib/supabase.ts**

```bash
mkdir -p /Users/espenlangsrud/github/uxwork/lib
```

```ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

- [ ] **Step 3: Opprett .env.local.example**

```
NEXT_PUBLIC_SUPABASE_URL=https://xyzxyzxyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

- [ ] **Step 4: Opprett .env.local med faktiske verdier**

Kopier `.env.local.example` til `.env.local` og fyll inn verdiene fra Supabase-dashboardet ditt (Settings → API).

```bash
cp /Users/espenlangsrud/github/uxwork/.env.local.example \
   /Users/espenlangsrud/github/uxwork/.env.local
```

Rediger `.env.local` med faktiske Supabase-nøkler.

- [ ] **Step 5: Verifiser at .env.local er i .gitignore**

```bash
grep "\.env\.local" /Users/espenlangsrud/github/uxwork/.gitignore
```

Forventet: `.env.local` skal vises. Hvis ikke, legg til manuelt.

- [ ] **Step 6: Verifiser at prosjektet fortsatt bygger med Supabase installert**

```bash
cd /Users/espenlangsrud/github/uxwork
npm run build
```

Forventet: `✓ Compiled successfully`

- [ ] **Step 7: Commit**

```bash
cd /Users/espenlangsrud/github/uxwork
git add lib/supabase.ts .env.local.example package.json package-lock.json
git commit -m "feat: legg til Supabase-klient"
```

---

### Task 4: Opprett components-mappe og commit docs

**Files:**
- Create: `components/.gitkeep`
- Commit: `docs/`

- [ ] **Step 1: Opprett tom components-mappe**

```bash
touch /Users/espenlangsrud/github/uxwork/components/.gitkeep
```

- [ ] **Step 2: Commit docs og components**

```bash
cd /Users/espenlangsrud/github/uxwork
git add components/.gitkeep docs/
git commit -m "chore: legg til components-mappe og dokumentasjon"
```

- [ ] **Step 3: Verifiser ferdig struktur**

```bash
ls /Users/espenlangsrud/github/uxwork
```

Forventet output inkluderer: `app  components  docs  lib  .env.local  .env.local.example  package.json`
