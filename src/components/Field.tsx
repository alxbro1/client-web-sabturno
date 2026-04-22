import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type SharedProps = {
  label: string;
  errors?: string[];
  hint?: string;
  trailing?: ReactNode;
};

export function InputField({ label, errors, hint, trailing, ...props }: SharedProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
      <label className="grid gap-[0.45rem]">
        <span className="text-[0.9rem] text-slate-100">{label}</span>
        <div className="relative">
          <input className="w-full border border-slate-400/[0.18] bg-[rgba(6,15,24,0.88)] text-white rounded-2xl px-4 py-[0.95rem]" {...props} />
        {trailing}
      </div>
        {hint ? <span className="text-[#aab8c9] text-sm">{hint}</span> : null}
      {errors?.map((error) => (
          <span key={error} className="text-rose-300 text-[0.84rem]">{error}</span>
      ))}
    </label>
  );
}

export function SelectField({ label, errors, children, ...props }: SharedProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
      <label className="grid gap-[0.45rem]">
        <span className="text-[0.9rem] text-slate-100">{label}</span>
        <select className="w-full border border-slate-400/[0.18] bg-[rgba(6,15,24,0.88)] text-white rounded-2xl px-4 py-[0.95rem]" {...props}>
        {children}
      </select>
      {errors?.map((error) => (
          <span key={error} className="text-rose-300 text-[0.84rem]">{error}</span>
      ))}
    </label>
  );
}

export function TextareaField({ label, errors, ...props }: SharedProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
      <label className="grid gap-[0.45rem]">
        <span className="text-[0.9rem] text-slate-100">{label}</span>
        <textarea className="w-full border border-slate-400/[0.18] bg-[rgba(6,15,24,0.88)] text-white rounded-2xl px-4 py-[0.95rem] min-h-[140px] resize-y" {...props} />
      {errors?.map((error) => (
          <span key={error} className="text-rose-300 text-[0.84rem]">{error}</span>
      ))}
    </label>
  );
}