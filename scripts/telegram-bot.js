#!/usr/bin/env node
/**
 * NOOI Telegram Bot — Auto-reply Chat ID
 * Run: node ~/nooi.net/scripts/telegram-bot.js
 * PM2: pm2 start ~/nooi.net/scripts/telegram-bot.js --name nooi-tg-bot --cwd /home/hadmin/nooi.net
 */

// Load .env.local manually
const fs = require("fs");
const path = require("path");
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN not set. Add to .env.local");
  process.exit(1);
}

const API = `https://api.telegram.org/bot${TOKEN}`;
let offset = 0;

async function getUpdates() {
  try {
    const res = await fetch(`${API}/getUpdates?offset=${offset}&timeout=30`);
    const data = await res.json();
    if (!data.ok) return;
    
    for (const update of data.result) {
      offset = update.update_id + 1;
      const msg = update.message;
      if (!msg) continue;
      
      const chatId = msg.chat.id;
      const text = msg.text || "";
      const name = msg.chat.first_name || "bạn";
      
      if (text === "/start" || text.startsWith("/start")) {
        await sendMsg(chatId, 
          `🎉 <b>Chào ${name}!</b>\n\n` +
          `Đây là Bot thông báo của <b>NOOI</b> — Kết nối chuyển mình.\n\n` +
          `📋 <b>Chat ID của bạn:</b>\n<code>${chatId}</code>\n\n` +
          `👉 Copy Chat ID này và dán vào mục <b>Cài đặt → Telegram Notification</b> trên NOOI để nhận nhắc nhở buổi học.\n\n` +
          `💡 Gõ /help để xem danh sách lệnh.`
        );
      } else if (text === "/help") {
        await sendMsg(chatId,
          `📚 <b>Danh sách lệnh:</b>\n\n` +
          `/start — Lấy Chat ID\n` +
          `/id — Xem Chat ID nhanh\n` +
          `/help — Hướng dẫn\n\n` +
          `🔔 Sau khi kết nối, bạn sẽ nhận:\n` +
          `• Nhắc nhở trước 15 phút khi buổi học Live sắp bắt đầu\n` +
          `• Thông báo sự kiện mới`
        );
      } else if (text === "/id") {
        await sendMsg(chatId, `📋 Chat ID: <code>${chatId}</code>`);
      }
    }
  } catch (err) {
    console.error("Poll error:", err.message);
    await sleep(5000);
  }
}

async function sendMsg(chatId, text) {
  try {
    const res = await fetch(`${API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    const data = await res.json();
    if (data.ok) console.log(`📤 Replied to ${chatId}`);
    else console.error(`❌ Send failed: ${data.description}`);
  } catch (err) {
    console.error("Send error:", err.message);
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log("🤖 NOOI Telegram Bot started");
  
  // Get bot info
  try {
    const res = await fetch(`${API}/getMe`);
    const data = await res.json();
    if (data.ok) console.log(`✅ Bot: @${data.result.username} (${data.result.first_name})`);
  } catch {}
  
  // Main polling loop
  while (true) {
    await getUpdates();
    await sleep(100);
  }
}

main();
