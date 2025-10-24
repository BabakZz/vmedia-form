'use client';

import { useEffect, useState } from 'react';
import SafeImage from '../components/SafeImage';

type LandingConfig = {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

type Branding = {
  logoSrc?: string;
  heroSrc?: string;
  brandName?: string;
};

export default function FormLanding() {
  const [landing, setLanding] = useState<LandingConfig | null>(null);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/form-config', { cache: 'no-store' });
        const j = await res.json();
        if (j?.config) {
          setLanding(j.config.landing || {});
          setBranding(j.config.branding || {});
        }
      } catch (err) {
        console.error('Error loading landing config:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <section className="flex items-center justify-center min-h-screen bg-[#0b0e12] text-white">
        <p className="opacity-70">در حال بارگذاری…</p>
      </section>
    );
  }

  return (
    <section className="relative w-full h-[100vh] flex flex-col justify-center items-center text-center text-white overflow-hidden">
      <SafeImage
        src={branding?.heroSrc || '/hero-placeholder.svg'}
        alt={branding?.brandName || 'VMedia Hero'}
        fill
        priority
        className="object-cover object-center opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/85" />

      <div className="relative z-10 max-w-3xl px-6">
        <img
          src={branding?.logoSrc || '/logo-vmedia.svg'}
          alt={branding?.brandName || 'V•Media'}
          className="mx-auto mb-8 opacity-80 w-28"
        />

        <h1 className="text-5xl md:text-6xl font-semibold mb-5 bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-blue-400">
          {landing?.title || 'V•Media Brand Brief'}
        </h1>

        <p className="text-gray-200/80 text-base md:text-lg leading-relaxed">
          {landing?.subtitle ||
            'لطفاً فرم را دقیق پر کن تا تیم وی‌مدیا دقیق‌ترین استراتژی و طراحی را برای برندت بسازد.'}
        </p>

        <div className="mt-10">
          <a
            href={landing?.ctaHref || '/form/brief'}
            className="btn-primary px-6 py-3 rounded-xl text-lg bg-blue-500 hover:bg-blue-600 transition shadow-lg"
          >
            {landing?.ctaLabel || 'شروع فرم'}
          </a>
        </div>
      </div>
    </section>
  );
}
