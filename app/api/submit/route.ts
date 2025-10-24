import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const BOT = process.env.TELEGRAM_BOT_TOKEN;
const CHAT = process.env.TELEGRAM_CHAT_ID;

export async function POST(req: NextRequest) {
  try {
    if (!BOT || !CHAT) {
      return NextResponse.json(
        { error: 'server_env_missing', detail: 'TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID تنظیم نشده.' },
        { status: 500 }
      );
    }

    let json: any = {};
    try {
      json = await req.json();
    } catch (e: any) {
      return NextResponse.json(
        { error: 'bad_request', detail: 'JSON بدنه درخواست نامعتبر است.' },
        { status: 400 }
      );
    }

    const d = (json?.payload ?? {}) as Record<string, any>;
    const c = (json?.context ?? {}) as Record<string, any>;

    // کمکی: آرایه → متن فارسی
    const arr = (x: any) => Array.isArray(x) && x.length ? x.join('، ') : '';

    const lines: string[] = [
      '📮 V•Media — Brand Brief',
      d.brandNameFa ? `• نام برند (FA): ${d.brandNameFa}` : '',
      d.brandNameEn ? `• نام برند (EN): ${d.brandNameEn}` : '',
      d.activityType ? `• نوع فعالیت: ${d.activityType}` : '',
      d.location ? `• موقعیت: ${d.location}` : '',
      d.link ? `• لینک: ${d.link}` : '',
      arr(d.goals) ? `• اهداف: ${arr(d.goals)}${d.goals?.includes('other') && d.goalsOtherText ? ` — (${d.goalsOtherText})` : ''}` : '',
      d.mainGoal ? `• هدف نهایی: ${d.mainGoal}` : '',
      d.likedBrands ? `• رفرنس‌ها: ${d.likedBrands}` : '',
      arr(d.desiredMood) ? `• مود: ${arr(d.desiredMood)}` : '',
      d.primaryColors ? `• رنگ‌های اصلی: ${d.primaryColors}` : '',
      d.proposedColors ? `• رنگ‌های پیشنهادی: ${d.proposedColors}` : '',
      arr(d.toneOfVoice) ? `• لحن: ${arr(d.toneOfVoice)}` : '',
      (arr(d.audienceAge) || arr(d.audienceGender) || d.audienceGeo)
        ? `• مخاطب: ${[arr(d.audienceAge), arr(d.audienceGender), d.audienceGeo || ''].filter(Boolean).join(' — ')}`
        : '',
      d.audienceInterests ? `• علایق/رفتار خرید: ${d.audienceInterests}` : '',
      d.contentNeeds ? `• نیازهای محتوا/خدمات: ${d.contentNeeds}` : '',
      d.competitors ? `• رقبا: ${d.competitors}` : '',
      d.notes ? `• نکات: ${d.notes}` : '',
      d.finalFeeling ? `• حس نهایی: ${d.finalFeeling}` : '',
      arr(d.discovery) ? `• آشنایی با ما: ${arr(d.discovery)}` : '',
      c.referer ? `• صفحه: ${c.referer}` : '',
      c.ts ? `• زمان: ${c.ts}` : '',
      c.userAgent ? `• UA: ${c.userAgent}` : '',
    ].filter(Boolean);

    const text = lines.join('\n') || '📮 V•Media — Brand Brief (بدون فیلد)';

    let tgRes: Response;
    try {
      tgRes = await fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT,
          text,                    // ⬅️ بدون parse_mode تا خطای Markdown نگیری
          disable_web_page_preview: true,
        }),
      });
    } catch (e: any) {
      return NextResponse.json(
        { error: 'telegram_failed', detail: `fetch_failed: ${e?.message || e}` },
        { status: 502 }
      );
    }

    if (!tgRes.ok) {
      const detail = await tgRes.text();
      return NextResponse.json({ error: 'telegram_failed', detail }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('API /api/submit error:', e);
    return NextResponse.json({ error: 'server_error', detail: e?.message || String(e) }, { status: 500 });
  }
}
