// app/api/submit/route.ts
import { NextResponse } from 'next/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID; // می‌تونی چندتا با , جدا کنی

// پیام را بسازیم (ساده و ایمن)
function formatMessage(payload: any, context: any) {
  const lines: string[] = ['📥 فرم جدید دریافت شد'];

  try {
    // هر step/سوال => مقدار
    const entries = Object.entries(payload || {});
    if (entries.length === 0) lines.push('— بدون فیلد —');

    for (const [k, v] of entries) {
      const value = Array.isArray(v) ? v.join(', ') : (v ?? '');
      lines.push(`• ${k}: ${String(value)}`);
    }
  } catch {
    lines.push('⚠️ خطا در parse payload');
  }

  // کمی کانتکست مفید
  if (context) {
    const url = context.referer ? `\n🔗 ${context.referer}` : '';
    const ua = context.userAgent ? `\n🖥 ${context.userAgent}` : '';
    lines.push(`${url}${ua}`);
  }

  const text = lines.join('\n').trim();
  return text.length ? text : '— empty —';
}

// ارسال به تلگرام با تقسیم پیام‌های طولانی
async function sendToTelegram(text: string) {
  if (!BOT_TOKEN || !CHAT_ID) {
    throw new Error('TELEGRAM envs missing');
  }

  const api = (path: string) => `https://api.telegram.org/bot${BOT_TOKEN}/${path}`;

  // حداکثر 4096 کاراکتر
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += 3900) {
    chunks.push(text.slice(i, i + 3900));
  }

  const chatIds = CHAT_ID.split(',').map((s) => s.trim()).filter(Boolean);

  for (const part of chunks) {
    // برای هر chat_id بفرست
    for (const id of chatIds) {
      const res = await fetch(api('sendMessage'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: id,
          text: part,
          disable_web_page_preview: true,
          parse_mode: 'HTML', // اگر متن خام می‌فرستی، می‌تونی برداری
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Telegram ${res.status}: ${body}`);
      }
    }
  }
}

export async function POST(req: Request) {
  try {
    const { payload, context } = await req.json().catch(() => ({}));
    const text = formatMessage(payload, context);

    await sendToTelegram(text);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('SUBMIT_ERROR', err?.message || err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'submit failed' },
      { status: 500 }
    );
  }
}
