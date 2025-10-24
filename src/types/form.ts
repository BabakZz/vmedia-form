export type InputKind = 'text' | 'textarea' | 'single' | 'multi';

export type Option = { id: string; label: string };

export type Question = {
  id: string;
  kind: InputKind;
  label: string;
  placeholder?: string;
  options?: Option[];     // برای single/multi
  required?: boolean;
};

export type Step = {
  id: string;
  title: string;
  questions: Question[];
};

export type FormConfig = {
  id: string;
  version: number;
  steps: Step[];
};
