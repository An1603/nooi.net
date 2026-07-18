#!/bin/bash
# NOOI Telegram Bot — Auto-reply with Chat ID
# Run: nohup bash ~/nooi.net/scripts/telegram-bot.sh &
# Stop: kill $(cat /tmp/nooi-telegram-bot.pid)

set -euo pipefail

# Load env
source /home/hadmin/nooi.net/.env.local 2>/dev/null || true

TOKEN="${TELEGRAM_BOT_TOKEN:?TELEGRAM_BOT_TOKEN not set}"
API="https://api.telegram.org/bot${TOKEN}"
PID_FILE="/tmp/nooi-telegram-bot.pid"

echo $$ > "$PID_FILE"
echo "🤖 NOOI Telegram Bot started (PID: $$)"

# Get bot info
BOT_INFO=$(curl -s "${API}/getMe")
BOT_NAME=$(echo "$BOT_INFO" | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['first_name'])" 2>/dev/null || echo "NOOI Bot")
echo "✅ Bot: ${BOT_NAME}"

OFFSET=0

while true; do
  # Long polling — wait up to 30s for new messages
  RESPONSE=$(curl -s --max-time 35 "${API}/getUpdates?offset=${OFFSET}&timeout=30" 2>/dev/null || echo '{"ok":false}')
  
  # Check if response is valid
  OK=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('ok', False))" 2>/dev/null || echo "False")
  
  if [ "$OK" != "True" ]; then
    sleep 2
    continue
  fi
  
  # Process each update
  COUNT=$(echo "$RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
results = data.get('result', [])
print(len(results))
" 2>/dev/null || echo "0")
  
  if [ "$COUNT" = "0" ]; then
    continue
  fi
  
  # Process messages
  echo "$RESPONSE" | python3 -c "
import sys, json

data = json.load(sys.stdin)
for update in data.get('result', []):
    update_id = update['update_id']
    message = update.get('message', {})
    chat = message.get('chat', {})
    chat_id = chat.get('id', '')
    text = message.get('text', '')
    first_name = chat.get('first_name', 'bạn')
    
    if text == '/start' or text.startswith('/start'):
        reply = f'''🎉 <b>Chào {first_name}!</b>

Đây là Bot thông báo của <b>NOOI</b> — Nền tảng phát triển bản thân.

📋 <b>Chat ID của bạn:</b>
<code>{chat_id}</code>

👉 Copy Chat ID này và dán vào mục <b>Cài đặt → Telegram Notification</b> trên NOOI để nhận nhắc nhở buổi học.

💡 Gõ /help để xem danh sách lệnh.'''
        print(f'REPLY:{chat_id}:{reply}')
    elif text == '/help':
        reply = '''📚 <b>Danh sách lệnh:</b>

/start — Lấy Chat ID của bạn
/help — Xem danh sách lệnh
/id — Xem Chat ID nhanh

🔔 Sau khi kết nối, bạn sẽ nhận:
• Nhắc nhở trước 15 phút khi buổi học Live sắp bắt đầu
• Thông báo khi có sự kiện mới'''
        print(f'REPLY:{chat_id}:{reply}')
    elif text == '/id':
        reply = f'📋 Chat ID: <code>{chat_id}</code>'
        print(f'REPLY:{chat_id}:{reply}')
    
    # Update offset
    print(f'OFFSET:{update_id + 1}')
" 2>/dev/null | while IFS= read -r line; do
    if [[ "$line" == REPLY:* ]]; then
      # Parse: REPLY:chat_id:message
      CHAT_ID=$(echo "$line" | cut -d: -f2)
      MSG=$(echo "$line" | cut -d: -f3-)
      # URL encode the message for Telegram API
      ENCODED_MSG=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$MSG")
      curl -s -X POST "${API}/sendMessage" \
        -H "Content-Type: application/json" \
        -d "{\"chat_id\": \"${CHAT_ID}\", \"text\": $(python3 -c "import json,sys; print(json.dumps(sys.argv[1]))" "$MSG"), \"parse_mode\": \"HTML\", \"disable_web_page_preview\": true}" > /dev/null &
      echo "📤 Replied to ${CHAT_ID}"
    elif [[ "$line" == OFFSET:* ]]; then
      NEW_OFFSET=${line#OFFSET:}
      # Update offset in parent shell (use file)
      echo "$NEW_OFFSET" > /tmp/nooi-tg-offset
    fi
  done
  
  # Read updated offset
  if [ -f /tmp/nooi-tg-offset ]; then
    OFFSET=$(cat /tmp/nooi-tg-offset)
  fi
  
  sleep 1
done
