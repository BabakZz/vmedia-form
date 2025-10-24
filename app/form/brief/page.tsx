'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

/** ========= Types ========= */
type FormData = Record<string, any>;
type InputKind = 'text' | 'textarea' | 'single' | 'multi';
type Option = { id: string; label: string };
type Question = {
  id: string;
  kind: InputKind;
  label: string;
  placeholder?: string;
  options?: Option[];
  required?: boolean;
  ui?: { col?: 'full' | 'half' };
};
type Step = { id: string; title: string; questions: Question[] };

type FormConfig = {
  id: string;
  version: number;
  branding?: { logoSrc?: string; brandName?: string };
  messages?: {
    loading?: string;
    formTitle?: string;
    progressPattern?: string;
    footnote?: string;
    errorSend?: string;
    submitting?: string;
  };
  ctas?: { next?: string; back?: string; submit?: string };
  ui?: { grid?: { mdCols?: number }; progress?: boolean };
  steps: Step[];
};

/** =============== Component =============== */
export default function BrandBriefForm() {
  const router = useRouter();
  const methods = useForm<FormData>({ mode: 'onSubmit' });
  const { register, handleSubmit, watch, setValue } = methods;

  const [config, setConfig] = useState<FormConfig | null>(null);
  const [step, setStep] = useState(1);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load dynamic config
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/form-config', { cache: 'no-store' });
        const j = await res.json();
        if (!j?.ok || !j?.config) throw new Error('config missing');
        setConfig(j.config as FormConfig);
      } catch (e) {
        console.error(e);
        alert('خطا در بارگذاری تنظیمات فرم');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Scroll to top when step changes
  useEffect(() => {
    const card = document.getElementById('brief-card');
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [step]);

  // Derived values
  const total = config?.steps?.length ?? 0;
  const safeIndex = total > 0 ? Math.max(0, Math.min(step - 1, total - 1)) : 0;
  const current: Step | null = total > 0 ? (config!.steps[safeIndex] as Step) : null;
  const pct = total > 0 ? (step / total) * 100 : 0;

  // Messages & CTAs from config
  const msgs = config?.messages || {};
  const ctas = config?.ctas || {};

  // Helpers
  const toggleMulti = (field: string, value: string) => {
    const arr = Array.isArray(watch(field)) ? (watch(field) as string[]) : [];
    const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
    setValue(field, next);
  };

  // Submit
  const onSubmit = async (payload: FormData) => {
    try {
      setSending(true);
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload,
          context: {
            referer: typeof window !== 'undefined' ? window.location.href : '',
            ts: new Date().toISOString(),
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          },
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      router.push('/form/done');
    } catch (e) {
      console.error(e);
      alert(msgs.errorSend || '❌ ارسال ناموفق بود.');
    } finally {
      setSending(false);
    }
  };

  // Animations
  const variants = {
    initial: { opacity: 0, y: 12, scale: 0.995, filter: 'blur(2px)' },
    enter: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transition: { duration: 0.28 } },
    exit: { opacity: 0, y: -12, scale: 0.995, filter: 'blur(2px)', transition: { duration: 0.22 } }
  };

  // Render
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-start bg-[#0b0e12] text-white overflow-x-hidden">
      {/* Header */}
      <header className="pointer-events-none select-none sticky top-0 z-30 flex justify-center py-4 bg-gradient-to-b from-black/30 to-transparent">
        <Image
          src={config?.branding?.logoSrc || '/logo-vmedia.svg'}
          alt={config?.branding?.brandName || 'V•Media'}
          width={132}
          height={44}
          className="opacity-90 drop-shadow-[0_0_12px_rgba(255,255,255,0.18)]"
        />
      </header>

      <div id="brief-card" className="w-full max-w-5xl mx-auto px-6 py-10">
        <motion.div
          className="card-apple p-6 md:p-10"
          initial={{ opacity: 0, scale: 0.995 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {/* Loading */}
          {loading && <div className="text-center py-16 opacity-80">{msgs.loading || 'در حال بارگذاری…'}</div>}

          {/* Real content */}
          {!loading && current && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="section-title">{msgs.formTitle || 'فرم اطلاعات برند'}</h2>
                  <p className="text-sm opacity-80 mt-1">
                    {(msgs.progressPattern || 'مرحله {{step}} از {{total}} • {{currentTitle}}')
                      .replace('{{step}}', step.toString())
                      .replace('{{total}}', total.toString())
                      .replace('{{currentTitle}}', current.title)}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              {config?.ui?.progress !== false && (
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-8">
                  <motion.div
                    className="h-full bg-white/70"
                    initial={false}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.35 }}
                  />
                </div>
              )}

              <FormProvider {...methods}>
                <form
                  onKeyDown={(e) => e.key === 'Enter' && step < total && e.preventDefault()}
                  className="relative"
                >
                  <AnimatePresence mode="wait">
                    <motion.div key={step} variants={variants} initial="initial" animate="enter" exit="exit">
                      <div
                        className={`grid grid-cols-1 md:grid-cols-${config?.ui?.grid?.mdCols || 2} gap-6`}
                      >
                        {current.questions.map((q) => {
                          const full =
                            q.ui?.col === 'full' ||
                            q.kind === 'textarea' ||
                            q.kind === 'multi' ||
                            q.kind === 'single';
                          return (
                            <div key={q.id} className={full ? 'md:col-span-2' : ''}>
                              <label className="block text-sm mb-2 opacity-85">
                                {q.label}{q.required ? <span className="text-red-400">*</span> : null}
                              </label>

                              {q.kind === 'text' && (
                                <input {...register(q.id)} placeholder={q.placeholder || ''} className="input-dark" />
                              )}

                              {q.kind === 'textarea' && (
                                <textarea {...register(q.id)} placeholder={q.placeholder || ''} className="textarea-dark" />
                              )}

                              {q.kind === 'single' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                  {q.options?.map((o) => (
                                    <label key={o.id} className="inline-flex items-center gap-2">
                                      <input type="radio" value={o.id} {...register(q.id)} />
                                      <span>{o.label}</span>
                                    </label>
                                  ))}
                                </div>
                              )}

                              {q.kind === 'multi' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                  {q.options?.map((o) => {
                                    const arr = watch(q.id) || [];
                                    const checked = Array.isArray(arr) ? arr.includes(o.id) : false;
                                    return (
                                      <label key={o.id} className="inline-flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={() => toggleMulti(q.id, o.id)}
                                        />
                                        <span>{o.label}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </form>
              </FormProvider>

              {/* Controls */}
              <div className="flex items-center justify-between mt-6">
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.max(1, s - 1))}
                  className="btn-outline"
                  disabled={step === 1}
                >
                  {ctas.back || 'برگشت'}
                </button>

                {step < total ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.min(total, s + 1))}
                    className="btn-primary"
                  >
                    {ctas.next || 'مرحله بعد'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit(onSubmit)}
                    disabled={sending}
                    className="btn-primary disabled:opacity-50"
                  >
                    {sending ? msgs.submitting || 'در حال ارسال…' : ctas.submit || 'ارسال نهایی'}
                  </button>
                )}
              </div>

              <p className="text-xs text-white/50 mt-4 text-center">
                {msgs.footnote || '*هیچ فیلدی اجباری نیست؛ هر چقدر خواستی پر کن یا خالی بذار.'}
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
