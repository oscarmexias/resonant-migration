# Deployment Conventions

## Vercel — Production Deployments

**Rule: GitHub integration only. Never run `vercel --prod` manually after a push.**

### Why
Running `vercel --prod` after `git push` creates two simultaneous production builds
(GitHub integration + CLI). The production alias ends up pointing to whichever
finishes last — non-deterministic. Caused visible "changes not reflecting" bug on 2026-02-26.

### Correct workflow
```bash
git add .
git commit -m "feat(...): ..."
git push origin main    # ← Vercel auto-deploys via GitHub integration
# Done. No vercel CLI needed.
```

### When to use the CLI
- `vercel dev` — local development only
- `vercel` (no --prod) — preview deployments for testing before merging

### Production URLs
- `https://resonant-migration-three.vercel.app` (primary)
- `https://resonant-migration-oscars-projects-48cbd6cc.vercel.app`
