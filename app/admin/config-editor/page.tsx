'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  DndContext, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove as arrMove } from 'array-move';

/** ===== لینک RAW گیت‌هاب را اینجا بگذار ===== */
const GITHUB_RAW_URL =
  'https://raw.githubusercontent.com/BabakZz/vmedia-form/main/src/data/form-config.json';

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

/* فارسی‌سازی نام‌ها */
const KIND_LABELS: Record<Question['kind'], string> = {
  text: 'متنی (تک‌خطی)',
  textarea: 'متنی (چندخطی)',
  single: 'گزینه‌ای (تک‌انتخاب)',
  multi: 'گزینه‌ای (چندانتخاب)',
};

function Handle() {
  return <span className="cursor-grab select-none px-2 text-white/60">⠿</span>;
}

/* آیتم قابل‌کشیدن */
function SortableItem({
  id, children, className,
}: { id: string; children: React.ReactNode; className?: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style: any = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} className={className}>
      <div className="flex items-center gap-2">
        <span {...attributes} {...listeners}><Handle/></span>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

export default function ConfigEditorPage() {
  const [cfg, setCfg] = useState<FormConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'steps' | 'branding' | 'landing' | 'messages' | 'ctas' | 'ui' | 'json'>('steps');
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(GITHUB_RAW_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error(String(res.status));
        setCfg(await res.json());
      } catch {
        setErr('خطا در خواندن config از GitHub Raw');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const jsonStr = useMemo(() => JSON.stringify(cfg ?? {}, null, 2), [cfg]);

  const setDeep = (path: (string | number)[], value: any) => {
    setCfg(prev => {
      if (!prev) return prev;
      const clone: any = structuredClone(prev);
      let cur = clone as any;
      for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]];
      cur[path[path.length - 1]] = value;
      return clone;
    });
  };

  /* Drag: Steps */
  const onDragEndSteps = (e: DragEndEvent) => {
    if (!cfg || !e.over || e.active.id === e.over.id) return;
    const from = cfg.steps.findIndex(s => s.id === e.active.id);
    const to = cfg.steps.findIndex(s => s.id === e.over!.id);
    if (from < 0 || to < 0) return;
    const steps = arrayMove(cfg.steps, from, to);
    setCfg({ ...cfg, steps });
  };

  /* Drag: Questions (در یک مرحله) */
  const onDragEndQuestions = (sIdx: number) => (e: DragEndEvent) => {
    if (!cfg || !e.over || e.active.id === e.over.id) return;
    const qs = cfg.steps[sIdx].questions;
    const from = qs.findIndex(q => q.id === e.active.id);
    const to = qs.findIndex(q => q.id === e.over!.id);
    if (from < 0 || to < 0) return;
    const nq = arrayMove(qs, from, to);
    const steps = [...cfg.steps];
    steps[sIdx] = { ...steps[sIdx], questions: nq };
    setCfg({ ...cfg, steps });
  };

  /* انتقال سؤال به مرحله دیگر */
  const moveQuestionToStep = (fromIdx: number, qIdx: number, toIdx: number) => {
    if (!cfg) return;
    const steps = [...cfg.steps];
    const [q] = steps[fromIdx].questions.splice(qIdx, 1);
    steps[toIdx].questions.push(q);
    setCfg({ ...cfg, steps });
  };

  const copyJSON = async () => {
    await navigator.clipboard.writeText(jsonStr);
    setOk('JSON کپی شد ✅ — در GitHub جایگزین کن');
    setTimeout(() => setOk(null), 2000);
  };
  const downloadJSON = () => {
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'form-config.json';
    a.click(); URL.revokeObjectURL(url);
  };

  if (loading) return <main className="min-h-screen grid place-items-center bg-[#0b0e12] text-white">در حال بارگذاری…</main>;
  if (!cfg) return <main className="min-h-screen grid place-items-center bg-[#0b0e12] text-white">{err || 'Config نیامد'}</main>;

  return (
    <main className="min-h-screen bg-[#0b0e12] text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-xl font-semibold">پنل مدیریت فرم</h1>
          <div className="flex gap-2">
            <button onClick={downloadJSON} className="btn-primary px-4 py-2 rounded-lg">دانلود JSON</button>
            <button onClick={copyJSON} className="btn-outline px-4 py-2 rounded-lg">کپی JSON</button>
          </div>
        </header>

        {(ok || err) && <div className={`p-3 rounded-xl ${ok ? 'bg-emerald-600/20' : 'bg-red-600/20'}`}>{ok || err}</div>}

        {/* تب‌ها */}
        <div className="flex gap-2 flex-wrap">
          {[
            ['steps','مرحله‌ها'],
            ['branding','برندینگ'],
            ['landing','لندینگ'],
            ['messages','پیام‌ها'],
            ['ctas','دکمه‌ها'],
            ['ui','رابط'],
            ['json','JSON'],
          ].map(([key, fa]) => (
            <button key={key}
              onClick={() => setTab(key as any)}
              className={`px-3 py-1.5 rounded-lg ${tab===key ? 'bg-white/15' : 'bg-white/5 hover:bg-white/10'}`}
            >{fa}</button>
          ))}
        </div>

        {/* --- STEPS --- */}
        {tab === 'steps' && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">مدیریت مرحله‌ها</h2>
              <button className="btn-primary px-3 py-1.5 rounded-lg"
                onClick={() => setCfg(p => (p ? { ...p, steps: [...p.steps, { id:`step_${p.steps.length+1}`, title:'مرحله جدید', questions:[] }] } : p))}
              >+ افزودن مرحله</button>
            </div>

            <DndContext sensors={sensors} onDragEnd={onDragEndSteps} modifiers={[restrictToVerticalAxis]}>
              <SortableContext items={cfg.steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
                {cfg.steps.map((s, sIdx) => (
                  <SortableItem key={s.id} id={s.id} className="rounded-2xl p-4 bg-white/5 space-y-4">
                    {/* header */}
                    <div className="grid md:grid-cols-2 gap-3">
                      <label className="block">
                        <span className="text-sm opacity-80">شناسه مرحله</span>
                        <input className="input-dark mt-1" value={s.id}
                          onChange={(e)=>setDeep(['steps',sIdx,'id'], e.target.value)} />
                      </label>
                      <label className="block">
                        <span className="text-sm opacity-80">عنوان مرحله</span>
                        <input className="input-dark mt-1" value={s.title}
                          onChange={(e)=>setDeep(['steps',sIdx,'title'], e.target.value)} />
                      </label>
                    </div>

                    {/* Questions header */}
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">سؤال‌ها</h3>
                      <button className="btn-primary px-3 py-1.5 rounded-lg"
                        onClick={() => setDeep(['steps', sIdx, 'questions'], [...s.questions, { id:`q_${s.questions.length+1}`, kind:'text', label:'سؤال جدید' }])}
                      >+ افزودن سؤال</button>
                    </div>

                    {/* Questions DnD */}
                    <DndContext sensors={sensors} onDragEnd={onDragEndQuestions(sIdx)} modifiers={[restrictToVerticalAxis]}>
                      <SortableContext items={s.questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-3">
                          {s.questions.map((q, qIdx) => (
                            <SortableItem key={q.id} id={q.id} className="rounded-xl p-3 bg-white/5">
                              <div className="grid md:grid-cols-2 gap-3">
                                <label className="block">
                                  <span className="text-sm opacity-80">شناسه سؤال</span>
                                  <input className="input-dark mt-1" value={q.id}
                                    onChange={(e)=>setDeep(['steps',sIdx,'questions',qIdx,'id'], e.target.value)} />
                                </label>

                                <label className="block">
                                  <span className="text-sm opacity-80">نوع سؤال</span>
                                  <select className="input-dark mt-1" value={q.kind}
                                    onChange={(e)=>setDeep(['steps',sIdx,'questions',qIdx,'kind'], e.target.value)}>
                                    {(['text','textarea','single','multi'] as const).map(k => (
                                      <option key={k} value={k}>{KIND_LABELS[k]}</option>
                                    ))}
                                  </select>
                                </label>

                                <label className="block">
                                  <span className="text-sm opacity-80">برچسب</span>
                                  <input className="input-dark mt-1" value={q.label}
                                    onChange={(e)=>setDeep(['steps',sIdx,'questions',qIdx,'label'], e.target.value)} />
                                </label>

                                <label className="block">
                                  <span className="text-sm opacity-80">placeholder</span>
                                  <input className="input-dark mt-1" value={q.placeholder || ''}
                                    onChange={(e)=>setDeep(['steps',sIdx,'questions',qIdx,'placeholder'], e.target.value)} />
                                </label>
                              </div>

                              <div className="flex items-center gap-4 mt-2">
                                <label className="flex items-center gap-2">
                                  <input type="checkbox" checked={q.required || false}
                                    onChange={(e)=>setDeep(['steps',sIdx,'questions',qIdx,'required'], e.target.checked)} />
                                  <span>ضروری</span>
                                </label>

                                <label className="flex items-center gap-2">
                                  <span>چیدمان</span>
                                  <select className="input-dark"
                                    value={q.ui?.col || ''}
                                    onChange={(e)=>setDeep(['steps',sIdx,'questions',qIdx,'ui','col'], e.target.value || undefined)}>
                                    <option value="">(خودکار)</option>
                                    <option value="full">تمام‌عرض</option>
                                    <option value="half">نیم‌عرض</option>
                                  </select>
                                </label>

                                {/* move to other step */}
                                <label className="flex items-center gap-2">
                                  <span>انتقال به مرحله:</span>
                                  <select className="input-dark"
                                    onChange={(e) => {
                                      const to = Number(e.target.value);
                                      if (!Number.isNaN(to)) moveQuestionToStep(sIdx, qIdx, to);
                                    }}>
                                    <option value="">—</option>
                                    {cfg.steps.map((st, idx) => (
                                      idx !== sIdx ? <option key={st.id} value={idx}>{st.title}</option> : null
                                    ))}
                                  </select>
                                </label>

                                <button className="btn-outline px-3 py-1.5 rounded-lg"
                                  onClick={()=>setDeep(['steps',sIdx,'questions'], s.questions.filter((_,i)=>i!==qIdx))}
                                >حذف سؤال</button>
                              </div>

                              {(q.kind === 'single' || q.kind === 'multi') && (
                                <div className="mt-3">
                                  <div className="flex items-center justify-between">
                                    <strong className="opacity-90">گزینه‌ها</strong>
                                    <button className="btn-outline px-3 py-1.5 rounded-lg"
                                      onClick={()=>setDeep(['steps',sIdx,'questions',qIdx,'options'], [...(q.options||[]), { id:`opt_${(q.options?.length||0)+1}`, label:'گزینه جدید' }])}
                                    >+ افزودن گزینه</button>
                                  </div>

                                  <div className="grid md:grid-cols-2 gap-3 mt-2">
                                    {(q.options || []).map((o, oIdx) => (
                                      <div key={`${o.id}-${oIdx}`} className="rounded-lg p-2 bg-white/5">
                                        <label className="block">
                                          <span className="text-sm opacity-80">opt.id</span>
                                          <input className="input-dark mt-1" value={o.id}
                                            onChange={(e)=>setDeep(['steps',sIdx,'questions',qIdx,'options',oIdx,'id'], e.target.value)} />
                                        </label>
                                        <label className="block mt-2">
                                          <span className="text-sm opacity-80">opt.label</span>
                                          <input className="input-dark mt-1" value={o.label}
                                            onChange={(e)=>setDeep(['steps',sIdx,'questions',qIdx,'options',oIdx,'label'], e.target.value)} />
                                        </label>
                                        <button className="btn-outline px-3 py-1.5 rounded-lg mt-2"
                                          onClick={()=>setDeep(['steps',sIdx,'questions',qIdx,'options'], (q.options||[]).filter((_,i)=>i!==oIdx))}
                                        >حذف گزینه</button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </SortableItem>
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>

                    <div className="pt-2">
                      <button className="btn-outline px-3 py-1.5 rounded-lg"
                        onClick={()=>setCfg(p => (p ? { ...p, steps: p.steps.filter((_,i)=>i!==sIdx) } : p))}
                      >حذف مرحله</button>
                    </div>
                  </SortableItem>
                ))}
              </SortableContext>
            </DndContext>
          </section>
        )}

        {/* --- سایر تب‌ها: فارسی‌سازی ورودی‌ها --- */}
        {tab === 'branding' && (
          <section className="grid md:grid-cols-2 gap-4">
            <Field label="نام برند" value={cfg.branding?.brandName} onChange={(v)=>setDeep(['branding','brandName'], v)}/>
            <Field label="لوگو (src)" value={cfg.branding?.logoSrc} onChange={(v)=>setDeep(['branding','logoSrc'], v)}/>
            <Field label="تصویر هدر (src)" value={cfg.branding?.heroSrc} onChange={(v)=>setDeep(['branding','heroSrc'], v)}/>
          </section>
        )}

        {tab === 'landing' && (
          <section className="grid md:grid-cols-2 gap-4">
            <Field label="عنوان لندینگ" value={cfg.landing?.title} onChange={(v)=>setDeep(['landing','title'], v)}/>
            <Field label="متن دکمه" value={cfg.landing?.ctaLabel} onChange={(v)=>setDeep(['landing','ctaLabel'], v)}/>
            <Field label="لینک دکمه" value={cfg.landing?.ctaHref} onChange={(v)=>setDeep(['landing','ctaHref'], v)}/>
            <Field label="زیرعنوان" value={cfg.landing?.subtitle} onChange={(v)=>setDeep(['landing','subtitle'], v)} multiline/>
          </section>
        )}

        {tab === 'messages' && (
          <section className="grid md:grid-cols-2 gap-4">
            {[
              ['loading','متن لودینگ'],
              ['formTitle','عنوان فرم'],
              ['progressPattern','الگوی پیشرفت'],
              ['footnote','یادداشت پایین'],
              ['errorSend','پیام خطا هنگام ارسال'],
              ['submitting','متن هنگام ارسال'],
              ['doneTitle','عنوان صفحه نهایی'],
              ['doneText','متن صفحه نهایی'],
            ].map(([key, fa]) => (
              <Field key={key} label={fa} value={(cfg.messages as any)?.[key]} onChange={(v)=>setDeep(['messages', key], v)} multiline={key==='footnote'||key==='doneText'}/>
            ))}
          </section>
        )}

        {tab === 'ctas' && (
          <section className="grid md:grid-cols-3 gap-4">
            <Field label="دکمه بعد" value={cfg.ctas?.next} onChange={(v)=>setDeep(['ctas','next'], v)}/>
            <Field label="دکمه برگشت" value={cfg.ctas?.back} onChange={(v)=>setDeep(['ctas','back'], v)}/>
            <Field label="دکمه ارسال" value={cfg.ctas?.submit} onChange={(v)=>setDeep(['ctas','submit'], v)}/>
          </section>
        )}

        {tab === 'ui' && (
          <section className="grid md:grid-cols-3 gap-4">
            <Field label="تعداد ستون‌ها در md" value={String(cfg.ui?.grid?.mdCols ?? '')} onChange={(v)=>setDeep(['ui','grid','mdCols'], Number(v)||2)}/>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={cfg.ui?.progress !== false} onChange={(e)=>setDeep(['ui','progress'], e.target.checked)}/>
              <span>نوار پیشرفت فعال باشد</span>
            </label>
          </section>
        )}

        {tab === 'json' && (
          <section>
            <textarea className="textarea-dark w-full h-[50vh]" readOnly value={jsonStr}/>
            <p className="text-xs opacity-60 mt-2">برای ویرایش از تب‌ها استفاده کن؛ بعد JSON را کپی/دانلود کن و در GitHub جایگزین کن.</p>
          </section>
        )}
      </div>
    </main>
  );
}

/* کامپوننت ورودی ساده فارسی */
function Field({ label, value, onChange, multiline }:{
  label: string; value?: string; onChange: (v:string)=>void; multiline?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm opacity-80">{label}</span>
      {multiline ? (
        <textarea className="textarea-dark mt-1" value={value ?? ''} onChange={e=>onChange(e.target.value)} />
      ) : (
        <input className="input-dark mt-1" value={value ?? ''} onChange={e=>onChange(e.target.value)} />
      )}
    </label>
  );
}
