# Diva & Dad: Rooftop Rumble

A lightweight browser fighting game inspired by classic arcade fighters.

## Play Locally

Open `index.html` in any modern browser.

## Play on GitHub Pages

This repo includes a GitHub Actions workflow that deploys the game to GitHub Pages whenever code is pushed to `main` or `master`.

After pushing this repository to GitHub and enabling Pages (Settings → Pages → Build and deployment → **GitHub Actions**), your playable URL will be:

`https://<your-github-username>.github.io/<your-repo-name>/`

### If you see a 404 page

1. Confirm the repo is **Public** (or you are using a plan that supports Pages for private repos).
2. Go to **Actions** and make sure the workflow **Deploy static site to GitHub Pages** ran successfully.
3. If your default branch is `master`, this workflow now deploys from that branch too.
4. In **Settings → Pages**, make sure source is **GitHub Actions**.
5. Wait 1-2 minutes after a successful deploy, then refresh the URL.

## Controls

### Diva (Player 1)
- `A` / `D`: Move
- `W`: Jump
- `F`: Punch
- `G`: Kick
- `H`: Block
- `R`: Star Blast (projectile)

### Dad (Player 2)
- `←` / `→`: Move
- `↑`: Jump
- `N`: Punch
- `M`: Kick
- `,`: Block
- `/`: Snack Shot (projectile)

## Rules
- Best of 3 rounds.
- 60 second round timer.
- Blocking reduces damage.
- Projectiles have a short cooldown.
