#!/bin/bash
# Purge Cloudflare cache
# Usage: bash scripts/purge-cf-cache.sh

cd /home/hadmin/nooi.net

# Load from .hermes/.env
EMAIL=$(grep CLOUDFLARE_EMAIL /home/hadmin/.hermes/.env | cut -d= -f2)
KEY=$(grep CLOUDFLARE_API_KEY /home/hadmin/.hermes/.env | cut -d= -f2)
ZONE=$(grep CLOUDFLARE_ZONE_ID /home/hadmin/.hermes/.env | cut -d= -f2)

if [ -z "$EMAIL" ] || [ -z "$KEY" ]; then
  echo "❌ Cloudflare credentials not found in ~/.hermes/.env"
  exit 1
fi

echo "🧹 Purging Cloudflare cache..."
curl -sf -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE/purge_cache" \
  -H "X-Auth-Email: $EMAIL" \
  -H "X-Auth-Key: $KEY" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}' > /dev/null && \
  echo "✅ Cloudflare cache purged!" || \
  echo "❌ Failed to purge cache"
