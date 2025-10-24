// src/lib/configStore.ts
import fs from 'fs/promises';
import path from 'path';

const KEY = 'FORM_CONFIG_V1';

// یک کانفیگ نمونه/پیش‌فرض — آزادانه ویرایشش کن
export const DEFAULT_CONFIG = {
  id: 'brand-brief',
  version: 1,
  title: 'فرم اطلاعات برند',
  ctas: { next: 'مرحله بعد', back: 'برگشت', submit: 'ارسال نهایی' },
  ui: { grid: { mdCols: 2 }, progress: true },
  steps: [
    {
      id: 'general',
      title: 'اطلاعات کلی',
      questions: [
        { id: 'brandNameFa', kind: 'text', label: 'نام برند (فارسی)', ui: { col: 'half' } },
        { id: 'brandNameEn', kind: 'text', label: 'نام برند (انگلیسی)', ui: { col: 'half' } },
        { id: 'activityType', kind: 'text', label: 'نوع فعالیت', ui: { col: 'half' } },
        { id: 'location', kind: 'text', label: 'موقعیت مکانی', ui: { col: 'half' } },
        { id: 'link', kind: 'text', label: 'لینک اینستاگرام / وب‌سایت', ui: { col: 'full' } }
      ]
    },
    {
      id: 'goals',
      title: 'اهداف همکاری',
      questions: [
        {
          id: 'goals',
          kind: 'multi',
          label: 'هدف همکاری با V•Media (چند انتخابی)',
          options: [
            { id: 'redesign_ig', label: 'بازطراحی کامل صفحه' },
            { id: 'content', label: 'تولید محتوا' },
            { id: 'identity', label: 'هویت بصری' },
            { id: 'ads', label: 'تبلیغات' },
            { id: 'other', label: 'سایر' }
          ],
          ui: { col: 'full' }
        },
        { id: 'goalsOtherText', kind: 'text', label: 'اگر «سایر» انتخاب شد', ui: { col: 'full' } },
        { id: 'mainGoal', kind: 'textarea', label: 'هدف نهایی/نزدیک', ui: { col: 'full' } }
      ]
    },
    {
      id: 'taste',
      title: 'سلیقه بصری و هویت',
      questions: [
        {
          id: 'desiredMood',
          kind: 'multi',
          label: 'فضا و حس دلخواه (چند انتخابی)',
          options: [
            { id: 'lux', label: 'لوکس' },
            { id: 'cozy', label: 'صمیمی' },
            { id: 'modern', label: 'مدرن' },
            { id: 'minimal', label: 'مینیمال' }
          ],
          ui: { col: 'full' }
        },
        { id: 'primaryColors', kind: 'text', label: 'رنگ‌های اصلی', ui: { col: 'half' } },
        { id: 'proposedColors', kind: 'text', label: 'رنگ‌های پیشنهادی', ui: { col: 'half' } },
        { id: 'likedBrands', kind: 'textarea', label: 'برندهای مرجع', ui: { col: 'full' } }
      ]
    },
    {
      id: 'audience',
      title: 'مخاطب، محتوا و نهایی',
      questions: [
        {
          id: 'audienceAge',
          kind: 'multi',
          label: 'سن حدودی مخاطب',
          options: [
            { id: '18_24', label: '18–24' },
            { id: '25_34', label: '25–34' },
            { id: '35_44', label: '35–44' },
            { id: '45p', label: '45+' }
          ],
          ui: { col: 'half' }
        },
        {
          id: 'audienceGender',
          kind: 'multi',
          label: 'جنسیت غالب',
          options: [
            { id: 'female', label: 'زن' },
            { id: 'male', label: 'مرد' },
            { id: 'mix', label: 'ترکیب' }
          ],
          ui: { col: 'half' }
        },
        { id: 'audienceGeo', kind: 'text', label: 'موقعیت جغرافیایی', ui: { col: 'full' } },
        { id: 'audienceInterests', kind: 'textarea', label: 'علایق/رفتار خرید', ui: { col: 'full' } },
        { id: 'contentNeeds', kind: 'textarea', label: 'محتوا و خدمات مورد نیاز', ui: { col: 'full' } },
        { id: 'competitors', kind: 'textarea', label: 'رقبا یا صفحات مرجع', ui: { col: 'full' } },
        { id: 'notes', kind: 'textarea', label: 'توضیحات تکمیلی', ui: { col: 'full' } },
        { id: 'finalFeeling', kind: 'text', label: 'حس نهایی', ui: { col: 'full' } }
      ]
    }
  ]
};

// --- Storage: Upstash Redis (اگر باشد) یا فایل لوکال ---
const useRedis = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

export async function readConfig(): Promise<any> {
  if (useRedis) {
    const url = process.env.UPSTASH_REDIS_REST_URL!;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
    const r = await fetch(`${url}/get/${KEY}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    const j = await r.json().catch(() => null);
    const raw = j?.result;
    if (raw) {
      try { return JSON.parse(raw); } catch {}
    }
    // اگر کلیدی نبود، پیش‌فرض را ست می‌کنیم
    await writeConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }

  // فایل
  const fp = path.join(process.cwd(), 'src', 'data', 'form-config.json');
  try {
    const buf = await fs.readFile(fp, 'utf8');
    return JSON.parse(buf);
  } catch {
    await fs.mkdir(path.dirname(fp), { recursive: true });
    await fs.writeFile(fp, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf8');
    return DEFAULT_CONFIG;
  }
}

export async function writeConfig(cfg: any): Promise<void> {
  if (useRedis) {
    const url = process.env.UPSTASH_REDIS_REST_URL!;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
    await fetch(`${url}/set/${KEY}/${encodeURIComponent(JSON.stringify(cfg))}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    return;
  }

  const fp = path.join(process.cwd(), 'src', 'data', 'form-config.json');
  await fs.mkdir(path.dirname(fp), { recursive: true });
  await fs.writeFile(fp, JSON.stringify(cfg, null, 2), 'utf8');
}
