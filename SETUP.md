# Moving the project out of OneDrive and into git

Run these in order from a normal Command Prompt. Nothing here is destructive —
the OneDrive copy stays where it is until you delete it yourself in step 6.

## 1. Copy the project to a plain local folder

`node_modules` and `.next` are excluded on purpose. They are the source of the
OneDrive placeholder errors (`errno -4094`) and get rebuilt in step 3 anyway.

```
robocopy "C:\Users\padma\OneDrive\Projects\radiology-maintenance" "C:\Dev\radiology-maintenance" /E /XD node_modules .next
```

Robocopy exit codes 0–7 mean success. Anything 8 or above is a real failure.

## 2. Confirm the environment file came across

```
cd /d C:\Dev\radiology-maintenance
type .env.local
```

You should see three keys: `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
If `.env.local` is missing, copy it manually — robocopy can skip files that
OneDrive had not yet hydrated.

## 3. Reinstall dependencies and build

```
npm install
npm run build
```

The build should now succeed. If it doesn't, the error is real this time
rather than a filesystem artifact.

## 4. Initialise git

```
git init
git add .
git status
```

**Stop and read `git status` before committing.** You must NOT see
`node_modules`, `.next`, or `.env.local` in the staged list. If you do, the
`.gitignore` is not being applied — fix it before continuing, because a
committed service role key has to be treated as compromised and rotated.

```
git commit -m "Initial commit: radiology equipment maintenance CMMS"
```

## 5. Push to a private remote

Create an **empty private** repository on GitHub (no README, no .gitignore —
those would conflict), then:

```
git remote add origin https://github.com/<you>/radiology-maintenance.git
git branch -M main
git push -u origin main
```

## 6. Retire the OneDrive copy

Only after step 5 succeeds and you can see your files on GitHub. Rename it
first rather than deleting, so you have a fallback for a few days:

```
ren "C:\Users\padma\OneDrive\Projects\radiology-maintenance" "radiology-maintenance-OLD"
```

The `radiology` folder next to it is the abandoned predecessor project. It is
not needed, but it costs nothing to leave in place as an archive.

## 7. Point your editor at the new location

`C:\Dev\radiology-maintenance` is now the working copy. Anything you edit in
the OneDrive folder from here on will be invisible to git.

---

## Why this matters

OneDrive silently emptied `src/lib/supabase/`, `src/lib/types/`, and
`src/app/api/admin/create-user/` on 3 February 2026. Because there was no git
repository, there was no history to restore from — the files had to be
reconstructed by hand from the predecessor project and the live database
schema. Git makes that class of loss recoverable in one command.

## Known issues still open

- Supabase project is on the free tier and **auto-pauses after ~7 days idle**.
  Fine while building; a blocker before anyone else depends on it.
- Leaked-password protection is disabled in Supabase Auth → Providers.
- Extensions `pg_trgm` and `btree_gist` live in the `public` schema. Low
  priority; moving them requires a reindex.
- Auth redirect URLs point at localhost and will need the real domain when
  the app is deployed.
