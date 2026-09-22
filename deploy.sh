#!/usr/bin/env bash
# ========================================
# Quantum Fate Lite · Hostinger VPS Deploy
# ========================================
# Usage:
#   1. SSH into Hostinger VPS
#   2. cd /home/<user>/domains/<your-domain>/public_html
#   3. git clone <your-private-repo> quantum-fate-lite
#   4. cd quantum-fate-lite
#   5. cp .env.example .env && nano .env     # fill real keys
#   6. Edit ecosystem.config.cjs cwd path
#   7. bash deploy.sh
#
# What it does:
#   - validate Node.js version >= 18
#   - install deps (native addon compiled on target)
#   - build standalone output
#   - create data dir with proper permissions
#   - backup existing DB if present
#   - start with PM2, persist on reboot
# ========================================

set -e

cd "$(dirname "$0")"

# Validate Node.js version
NODE_MAJOR=$(node -e "console.log(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "ERROR: Node.js >= 18 required, found v$(node -v)"
  echo "Install via: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs"
  exit 1
fi
echo "[1/7] Node version: $(node -v) ✓"

echo "[2/7] Install dependencies..."
npm ci --no-audit --no-fund

echo "[3/7] Build standalone output..."
SKIP_ENV_VALIDATION=1 npm run build

echo "[4/7] Create data dir..."
mkdir -p data
chmod 700 data

echo "[5/7] Backup existing DB..."
if [ -f data/qfl.db ]; then
  bash scripts/backup-db.sh
else
  echo "  No existing DB, skipping backup."
fi

echo "[6/7] Copy static assets for standalone..."
# Standalone mode needs static files copied manually
cp -r public .next/standalone/public 2>/dev/null || true
cp -r .next/static .next/standalone/.next/static 2>/dev/null || true

echo "[7/7] PM2 start..."
if ! command -v pm2 >/dev/null 2>&1; then
  echo "Installing PM2..."
  npm i -g pm2
fi

# Edit ecosystem.config.cjs paths first
pm2 delete quantum-fate-lite 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

echo ""
echo "✓ Deployed. Check status:  pm2 status"
echo "  Logs:                   pm2 logs quantum-fate-lite"
echo "  Open:                   http://<your-domain>:3000"
echo "  (Or via nginx reverse proxy on :80/:443)"
echo ""
echo "⚠ Remember to:"
echo "  1. Edit ecosystem.config.cjs cwd path"
echo "  2. Set ADMIN_PASSWORD to a strong value in .env"
echo "  3. Set NEXT_PUBLIC_SITE_URL to your real domain in .env"
echo "  4. Run 'pm2 startup' to auto-start on reboot"
echo "  5. Add backup cron: crontab -e → 0 */6 * * * cd /path && bash scripts/backup-db.sh"
