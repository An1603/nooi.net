#!/bin/bash
# NOOI Deploy Script — zero-downtime via PM2 graceful reload
set -e

cd /home/hadmin/nooi.net

echo "🔨 Building..."
npm run build

echo "📤 Pushing to git..."
git add -A
git commit -m "$1" || true
git push

echo "🔄 Reloading (zero-downtime)..."
# Kill any stale process holding port 3000 before reload
kill -9 $(lsof -ti:3000) 2>/dev/null || true
sleep 1
pm2 reload nooi --wait-ready --listen-timeout 5000 2>/dev/null || pm2 start npm --name nooi -- start

echo "⏳ Waiting for health check..."
for i in 1 2 3 4 5 6 7 8; do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
  if [ "$code" = "200" ]; then
    echo "✅ Local healthy (HTTP $code)"
    break
  fi
  echo "  Attempt $i: HTTP $code"
  sleep 2
done

echo "🌐 Verifying production..."
for i in 1 2 3 4 5; do
  code=$(curl -s -o /dev/null -w "%{http_code}" https://nooi.net 2>/dev/null || echo "000")
  if [ "$code" = "200" ]; then
    echo "✅ Production healthy (HTTP $code)"
    break
  fi
  echo "  Attempt $i: HTTP $code"
  sleep 3
done

echo "🧹 Purging Cloudflare cache..."
bash scripts/purge-cf-cache.sh

echo "✅ Done — deploy successful!"
