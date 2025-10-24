'use client';

import { useEffect, useState } from 'react';

export default function DonePage() {
  const [title, setTitle] = useState('مرسی! ✅');
  const [text, setText] = useState('اطلاعاتت با موفقیت ارسال شد. به‌زودی باهات تماس می‌گیریم.');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/form-config', { cache: 'no-store' });
        const j = await res.json();
        if (j?.config?.messages) {
          const msgs = j.config.messages;
          setTitle(msgs.doneTitle || 'مرسی! ✅');
          setText(msgs.doneText || 'اطلاعاتت با موفقیت ارسال شد. به‌زودی باهات تماس می‌گیریم.');
        }
      } catch (err) {
        console.error('Error loading config:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0b0e12] text-white">
        <p className="opacity-70">در حال بارگذاری…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0b0e12] text-white">
      <div className="card-apple p-10 text-center max-w-md">
        <h1 className="text-2xl font-semibold mb-3">{title}</h1>
        <p className="text-white/80">{text}</p>
      </div>
    </main>
  );
}
