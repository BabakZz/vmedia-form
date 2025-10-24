'use client';

import { useEffect, useMemo, useState } from 'react';

/** ===================== EDIT THIS: your raw GitHub URL ===================== */
// مثال: https://raw.githubusercontent.com/<owner>/<repo>/<branch>/<path>
const GITHUB_RAW_URL =
  'https://raw.githubusercontent.com/BabakZz/vmedia-form/main/src/data/form-config.json';
/** ========================================================================= */

type Option = { id: string; label: string };
type Question = {
  id: string;
  kind: 'text' | 'textarea' | 'single' | 'multi';
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
  branding?: { logoSrc?: string; heroSrc?: string; brandName?: string };
  landing?: { title?: string; subtitle?: string; ctaLabel?: string; ctaHref?: string };
  messages?: {
    loading?: string; formTitle?: string; progressPattern?: string; footnote?: string;
    errorSend?: string; submitting?: string; doneTitle?: string; doneText?: string;
  };
  ctas?: { next?: string; back?: string; submit?: string };
  ui?: { grid?: { mdCols?: number }; progress?: boolean };
  steps: Step[];
};

function TextInput({
  label, value, onChange, textarea, placeholder,
}: { label: string; value?: string; onChange: (v: string) => void; textarea?: boolean; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-sm opacity-80">{label}</span>
      {textarea ? (
        <textarea
          className="textarea-dark mt-1"
          placeholder={placeholder || ''}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="input-dark mt-1"
          placeholder={placeholder || ''}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}

export default function ConfigEditorPage() {
  const [cfg, setCfg] = useState<FormConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<'branding' | 'landing' | 'messages' | 'ctas' | 'ui' | 'steps' | 'json'>('steps');

  // load from GitHub raw
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(GITHUB_RAW_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as FormConfig;
        setCfg(json);
      } catch (e) {
        console.error(e);
        setErr('خطا در خواندن config از GitHub Raw');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const jsonStr = useMemo(() => JSON.stringify(cfg ?? {}, null, 2), [cfg]);

  const setDeep = (path: (string | number)[], value: any) => {
    setCfg((prev) => {
      if (!prev) return prev;
      const clone: any = structuredClone(prev);
      let cur: any = clone;
      for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]];
      cur[path[path.length - 1]] = value;
      return clone;
    });
  };

  const addStep = () =>
    setCfg((p) =>
      p
        ? {
            ...p,
            steps: [...p.steps, { id: `step_${p.steps.length + 1}`, title: 'مرحله جدید', questions: [] }],
          }
        : p
    );

  const removeStep = (sIdx: number) =>
    setCfg((p) => (p ? { ...p, steps: p.steps.filter((_, i) => i !== sIdx) } : p));

  const addQuestion = (sIdx: number) =>
    setCfg((p) => {
      if (!p) return p;
      const steps = [...p.steps];
      const qs = [...steps[sIdx].questions];
      qs.push({ id: `q_${qs.length + 1}`, kind: 'text', label: 'سؤال جدید', placeholder: '' });
      steps[sIdx] = { ...steps[sIdx], questions: qs };
      return { ...p, steps };
    });

  const removeQuestion = (sIdx: number, qIdx: number) =>
    setCfg((p) => {
      if (!p) return p;
      const steps = [...p.steps];
      const qs = steps[sIdx].questions.filter((_, i) => i !== qIdx);
      steps[sIdx] = { ...steps[sIdx], questions: qs };
      return { ...p, steps };
    });

  const addOption = (sIdx: number, qIdx: number) =>
    setCfg((p) => {
      if (!p) return p;
      const steps = [...p.steps];
      const q = { ...steps[sIdx].questions[qIdx] };
      const opts = [...(q.options || [])];
      opts.push({ id: `opt_${opts.length + 1}`, label: 'گزینه جدید' });
      q.options = opts;
      steps[sIdx].questions[qIdx] = q;
      return { ...p, steps };
    });

  const removeOption = (sIdx: number, qIdx: number, oIdx: number) =>
    setCfg((p) => {
      if (!p) return p;
      const steps = [...p.steps];
      const q = { ...steps[sIdx].questions[qIdx] };
      q.options = (q.options || []).filter((_, i) => i !== oIdx);
      steps[sIdx].questions[qIdx] = q;
      return { ...p, steps };
    });

  const copyJSON = async () => {
    await navigator.clipboard.writeText(jsonStr);
    setOk('JSON کپی شد ✅ (در GitHub جایگزین کن)');
    setTimeout(() => setOk(null), 2000);
  };

  const downloadJSON = () => {
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'form-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0b0e12] text-white">
        <p className="opacity-70">در حال بارگذاری…</p>
      </main>
    );
  }
  if (err) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0b0e12] text-white">
        <p className="opacity-80">{err}</p>
      </main>
    );
  }
  if (!cfg) return null;

  return (
    <main className="min-h-screen bg-[#0b0e12] text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-xl font-semibold">Config Editor (GitHub Raw)</h1>
          <div className="flex gap-2">
            <button className="btn-outline px-4 py-2 rounded-lg" onClick={copyJSON}>Copy JSON</button>
            <button className="btn-primary px-4 py-2 rounded-lg" onClick={downloadJSON}>Download JSON</button>
          </div>
        </header>

        {(ok || err) && (
          <div className={`p-3 rounded-xl ${ok ? 'bg-emerald-600/20' : 'bg-red-600/20'}`}>
            {ok || err}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {(['steps','branding','landing','messages','ctas','ui','json'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg ${tab===t ? 'bg-white/15' : 'bg-white/5 hover:bg-white/10'}`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Branding */}
        {tab === 'branding' && (
          <section className="grid md:grid-cols-2 gap-4">
            <TextInput label="brandName" value={cfg.branding?.brandName} onChange={(v) => setDeep(['branding','brandName'], v)} />
            <TextInput label="logoSrc" value={cfg.branding?.logoSrc} onChange={(v) => setDeep(['branding','logoSrc'], v)} />
            <TextInput label="heroSrc" value={cfg.branding?.heroSrc} onChange={(v) => setDeep(['branding','heroSrc'], v)} />
          </section>
        )}

        {/* Landing */}
        {tab === 'landing' && (
          <section className="grid md:grid-cols-2 gap-4">
            <TextInput label="title" value={cfg.landing?.title} onChange={(v) => setDeep(['landing','title'], v)} />
            <TextInput label="ctaLabel" value={cfg.landing?.ctaLabel} onChange={(v) => setDeep(['landing','ctaLabel'], v)} />
            <TextInput label="ctaHref" value={cfg.landing?.ctaHref} onChange={(v) => setDeep(['landing','ctaHref'], v)} />
            <TextInput label="subtitle" value={cfg.landing?.subtitle} onChange={(v) => setDeep(['landing','subtitle'], v)} textarea />
          </section>
        )}

        {/* Messages */}
        {tab === 'messages' && (
          <section className="grid md:grid-cols-2 gap-4">
            {[
              'loading','formTitle','progressPattern','footnote','errorSend','submitting','doneTitle','doneText'
            ].map((k) => (
              <TextInput
                key={k}
                label={`messages.${k}`}
                value={(cfg.messages as any)?.[k]}
                onChange={(v) => setDeep(['messages', k], v)}
                textarea={k==='footnote' || k==='doneText'}
              />
            ))}
          </section>
        )}

        {/* CTAs */}
        {tab === 'ctas' && (
          <section className="grid md:grid-cols-3 gap-4">
            {(['next','back','submit'] as const).map((k) => (
              <TextInput key={k} label={`ctas.${k}`} value={(cfg.ctas as any)?.[k]} onChange={(v) => setDeep(['ctas',k], v)} />
            ))}
          </section>
        )}

        {/* UI */}
        {tab === 'ui' && (
          <section className="grid md:grid-cols-3 gap-4">
            <TextInput
              label="ui.grid.mdCols"
              value={String(cfg.ui?.grid?.mdCols ?? '')}
              onChange={(v) => setDeep(['ui','grid','mdCols'], Number(v) || 2)}
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={cfg.ui?.progress !== false}
                onChange={(e) => setDeep(['ui','progress'], e.target.checked)}
              />
              <span>progress bar enabled</span>
            </label>
          </section>
        )}

        {/* Steps & Questions */}
        {tab === 'steps' && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Steps</h2>
              <button className="btn-primary px-3 py-1.5 rounded-lg" onClick={addStep}>+ Add Step</button>
            </div>

            {cfg.steps.map((s, sIdx) => (
              <div key={s.id} className="rounded-2xl p-4 bg-white/5 space-y-4">
                <div className="flex items-center gap-2">
                  <TextInput label="step.id" value={s.id} onChange={(v) => setDeep(['steps', sIdx, 'id'], v)} />
                  <TextInput label="step.title" value={s.title} onChange={(v) => setDeep(['steps', sIdx, 'title'], v)} />
                  <button className="btn-outline px-3 py-1.5 rounded-lg" onClick={() => removeStep(sIdx)}>حذف مرحله</button>
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Questions</h3>
                  <button className="btn-primary px-3 py-1.5 rounded-lg" onClick={() => addQuestion(sIdx)}>+ Add Question</button>
                </div>

                <div className="space-y-3">
                  {s.questions.map((q, qIdx) => (
                    <div key={q.id} className="rounded-xl p-3 bg-white/5">
                      <div className="grid md:grid-cols-2 gap-3">
                        <TextInput label="q.id" value={q.id} onChange={(v) => setDeep(['steps', sIdx, 'questions', qIdx, 'id'], v)} />
                        <label className="block">
                          <span className="text-sm opacity-80">q.kind</span>
                          <select
                            className="input-dark mt-1"
                            value={q.kind}
                            onChange={(e) => setDeep(['steps', sIdx, 'questions', qIdx, 'kind'], e.target.value)}
                          >
                            <option value="text">text</option>
                            <option value="textarea">textarea</option>
                            <option value="single">single (radio)</option>
                            <option value="multi">multi (checkbox)</option>
                          </select>
                        </label>
                        <TextInput label="q.label" value={q.label} onChange={(v) => setDeep(['steps', sIdx, 'questions', qIdx, 'label'], v)} />
                        <TextInput label="q.placeholder" value={q.placeholder || ''} onChange={(v) => setDeep(['steps', sIdx, 'questions', qIdx, 'placeholder'], v)} />
                      </div>

                      <div className="flex items-center gap-4 mt-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={q.required || false}
                            onChange={(e) => setDeep(['steps', sIdx, 'questions', qIdx, 'required'], e.target.checked)}
                          />
                          <span>required</span>
                        </label>

                        <label className="flex items-center gap-2">
                          <span>ui.col:</span>
                          <select
                            className="input-dark"
                            value={q.ui?.col || ''}
                            onChange={(e) => setDeep(['steps', sIdx, 'questions', qIdx, 'ui', 'col'], e.target.value || undefined)}
                          >
                            <option value="">(auto)</option>
                            <option value="full">full</option>
                            <option value="half">half</option>
                          </select>
                        </label>
                      </div>

                      {(q.kind === 'single' || q.kind === 'multi') && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between">
                            <strong className="opacity-90">Options</strong>
                            <button className="btn-outline px-3 py-1.5 rounded-lg" onClick={() => addOption(sIdx, qIdx)}>+ Add Option</button>
                          </div>
                          <div className="grid md:grid-cols-2 gap-3 mt-2">
                            {(q.options || []).map((o, oIdx) => (
                              <div key={`${o.id}-${oIdx}`} className="rounded-lg p-2 bg-white/5">
                                <TextInput
                                  label="opt.id"
                                  value={o.id}
                                  onChange={(v) => setDeep(['steps', sIdx, 'questions', qIdx, 'options', oIdx, 'id'], v)}
                                />
                                <TextInput
                                  label="opt.label"
                                  value={o.label}
                                  onChange={(v) => setDeep(['steps', sIdx, 'questions', qIdx, 'options', oIdx, 'label'], v)}
                                />
                                <button className="btn-outline px-3 py-1.5 rounded-lg mt-2" onClick={() => removeOption(sIdx, qIdx, oIdx)}>
                                  حذف گزینه
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-3">
                        <button className="btn-outline px-3 py-1.5 rounded-lg" onClick={() => removeQuestion(sIdx, qIdx)}>
                          حذف سؤال
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Raw JSON */}
        {tab === 'json' && (
          <section>
            <textarea className="textarea-dark w-full h-[50vh]" value={jsonStr} onChange={() => {}} readOnly />
            <p className="text-xs opacity-60 mt-2">
              این فقط نمایش خام JSON است. برای ویرایش از تب‌های بالا استفاده کن و بعد «Copy/Download» بزن.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
