# Deploying to https://radiology.padhu.tech

Target: Hostinger VPS that **already serves other sites via Nginx**. Nothing
here touches your existing vhosts — we add one new server block alongside them.

Architecture:

```
browser ──HTTPS──> Nginx (:443, Let's Encrypt) ──proxy──> Next.js (:3100, PM2)
                                                              │
                                                              └──> Supabase (cloud)
```

---

## Step 0 — Pre-flight checks

Run these first and read the output before changing anything.

```bash
node -v                    # need v20.9+ for Next 16; blank = not installed
pm2 -v                     # blank = not installed
nginx -v                   # confirm Nginx present
ss -ltnp | grep -E ':(3000|3100)'   # must be EMPTY - if not, pick another port
dig +short radiology.padhu.tech     # must return your VPS IP
free -m                    # <2GB RAM? see "Build runs out of memory" below
```

Two things to note:

- **If `node -v` shows a version another site depends on**, do not replace it
  system-wide. Use `nvm` for a dedicated deploy user instead (Step 2b).
- **If port 3100 is taken**, choose a free one and change it consistently in
  `ecosystem.config.js`, the Nginx block, and nothing else.

---

## Step 1 — Supabase: allow the new domain

Do this before deploying, or login will silently fail in production.

Supabase dashboard → your **Radiology** project → **Authentication** → **URL Configuration**:

- **Site URL**: `https://radiology.padhu.tech`
- **Redirect URLs** — add both:
  - `https://radiology.padhu.tech/**`
  - `http://localhost:3000/**`  *(keep, so local dev still works)*

While you're in the dashboard, also turn on **leaked password protection**
(Authentication → Providers → Email) — it's been flagged as off since we started.

### Also: get off the free tier

Free projects **auto-pause after ~7 days idle**. Yours already did once. On a
public URL that means the first visitor after a quiet week hits a dead database
and there is nothing the app can do about it. Upgrade the project before you
share the link with anyone.

---

## Step 2 — Install Node and PM2

### 2a. If Node is absent, or present and nothing else depends on it

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
```

### 2b. If another site needs a different Node version

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 22
nvm alias default 22
```

With nvm, PM2 must be started from a shell where nvm is loaded, or `pm2 startup`
will fail to find node on reboot. `pm2 startup` prints the exact command to run —
follow it literally.

### PM2

```bash
sudo npm install -g pm2
sudo mkdir -p /var/log/pm2
```

---

## Step 3 — Give the server read access to your private repo

The repo is private, so cloning needs credentials. A **read-only deploy key** is
the right tool — scoped to this one repository, no access to anything else.

On the VPS:

```bash
ssh-keygen -t ed25519 -C "vps-radiology-deploy" -f ~/.ssh/id_ed25519_radiology -N ""
cat ~/.ssh/id_ed25519_radiology.pub
```

Copy that public key. On GitHub: repo → **Settings** → **Deploy keys** → **Add
deploy key**. Paste it, name it `hostinger-vps`, and leave *Allow write access*
**unticked**.

Tell SSH to use it for GitHub:

```bash
cat >> ~/.ssh/config <<'EOF'

Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_radiology
  IdentitiesOnly yes
EOF

chmod 600 ~/.ssh/config
ssh -T git@github.com     # expect: "Hi padhu-lp/radiology-maintenance! You've successfully authenticated"
```

---

## Step 4 — Clone and configure

```bash
sudo mkdir -p /var/www
sudo chown -R "$USER":"$USER" /var/www

git clone git@github.com:padhu-lp/radiology-maintenance.git /var/www/radiology
cd /var/www/radiology
```

Create the environment file — **this is not in git and must be created by hand**:

```bash
nano .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://bmfpmawingyslabxsdia.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your anon key>
SUPABASE_SERVICE_ROLE_KEY=<your service role key>
```

Copy the values from your local `.env.local`. Then lock it down — the service
role key bypasses every RLS policy:

```bash
chmod 600 .env.local
```

---

## Step 5 — Build and start

```bash
cd /var/www/radiology
npm ci
npm run build

chmod +x deploy.sh
pm2 start ecosystem.config.js
pm2 save
pm2 startup          # run the command it prints, so PM2 survives reboots
```

Confirm the app is actually listening before touching Nginx:

```bash
curl -I http://127.0.0.1:3100
# expect HTTP/1.1 200 OK  (or 307 redirect to /login - also fine)
pm2 logs radiology --lines 30
```

Do not continue until this responds.

---

## Step 6 — Nginx server block

New file — your existing sites are untouched:

```bash
sudo nano /etc/nginx/sites-available/radiology.padhu.tech
```

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name radiology.padhu.tech;

    # Equipment photos and attachments may be sizeable.
    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_http_version 1.1;

        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        'upgrade';
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        proxy_read_timeout 60s;
    }
}
```

`X-Forwarded-Proto` matters: without it Next.js believes it is on plain HTTP and
will build `http://` redirect URLs, which breaks the auth flow behind TLS.

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/radiology.padhu.tech /etc/nginx/sites-enabled/
sudo nginx -t          # MUST say "syntax is ok" and "test is successful"
sudo systemctl reload nginx
```

If `nginx -t` fails, fix it before reloading — a reload with a broken config
will not take down your other sites, but a restart would.

Check `http://radiology.padhu.tech` now loads (insecurely) before adding TLS.

---

## Step 7 — HTTPS

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d radiology.padhu.tech
```

Choose **redirect** when asked, so HTTP traffic is forced to HTTPS. Certbot
rewrites your server block to add the `443` listener and certificate paths.

Verify renewal is armed:

```bash
sudo certbot renew --dry-run
systemctl list-timers | grep certbot
```

---

## Step 8 — Verify

- `https://radiology.padhu.tech` → login page, valid padlock
- Sign in as `padmanabhan@manentia.ai` (admin) → lands on `/dashboard`
- Sign in as `padhu.lp2@gmail.com` (technician) → can edit and close a work order
- Signed out, visit `https://radiology.padhu.tech/work-orders` → redirects to
  `/login?redirectTo=/work-orders`
- `sudo reboot`, wait, then confirm the site returns on its own — this proves
  `pm2 startup` worked

---

## Future deployments

From your laptop:

```
git push origin main
```

On the server:

```bash
cd /var/www/radiology && ./deploy.sh
```

`deploy.sh` refuses to run if there are uncommitted changes on the server, so
the running code always matches a real commit.

---

## Troubleshooting

**502 Bad Gateway** — Next.js is not running or is on a different port.
`pm2 status`, `pm2 logs radiology`, `ss -ltnp | grep 3100`.

**Login redirects to localhost** — Step 1 was skipped or the Site URL is wrong.

**Redirect loop, or auth drops on every navigation** — `X-Forwarded-Proto` is
missing from the Nginx block.

**Build runs out of memory** (build killed, exit 137) — common on 1–2 GB VPS.
Add swap:

```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**Certbot fails to verify** — DNS has not propagated, or port 80 is blocked.
`dig +short radiology.padhu.tech` and `sudo ufw status`.

**Site works, then dies days later** — check whether the Supabase project
auto-paused. See Step 1.

---

## Known gaps at time of deployment

Not blockers, but you should know what you are shipping:

- `maintenance/[id]/edit`, `technicians/[id]/edit` and `parts-inventory/[id]/edit`
  read `params.id` synchronously, which Next 16 no longer supports. Likely
  broken at runtime; untested.
- No UI exists for `qc_tests` or `locations`.
- Technicians see raw Postgres permission errors on admin-only forms.
- `eslint-config-next` is pinned to 16.0.4 while Next is 16.3.0.
