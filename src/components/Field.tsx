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
        <span className="text-[0.86rem] font-semibold tracking-[0.04em] text-white/88">{label}</span>
        <div className="relative">
          <input
            className="w-full border border-white/16 bg-[rgba(255,255,255,0.03)] text-white rounded-2xl px-4 py-[0.95rem] transition-[border-color,box-shadow,background-color] duration-150 focus:border-[#00f068]/55 focus:bg-[rgba(255,255,255,0.045)] focus:outline-none focus:ring-2 focus:ring-[#00f068]/22"
            {...props}
          />
        {trailing}
      </div>
        {hint ? <span className="text-white/52 text-sm">{hint}</span> : null}
      {errors?.map((error) => (
          <span key={error} className="text-rose-300 text-[0.84rem]">{error}</span>
      ))}
    </label>
  );
}

export function SelectField({ label, errors, children, ...props }: SharedProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
      <label className="grid gap-[0.45rem]">
        <span className="text-[0.86rem] font-semibold tracking-[0.04em] text-white/88">{label}</span>
        <select
          className="w-full border border-white/16 bg-[rgba(255,255,255,0.03)] text-white rounded-2xl px-4 py-[0.95rem] transition-[border-color,box-shadow,background-color] duration-150 focus:border-[#00f068]/55 focus:bg-[rgba(255,255,255,0.045)] focus:outline-none focus:ring-2 focus:ring-[#00f068]/22"
          {...props}
        >
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
        <span className="text-[0.86rem] font-semibold tracking-[0.04em] text-white/88">{label}</span>
        <textarea
          className="w-full border border-white/16 bg-[rgba(255,255,255,0.03)] text-white rounded-2xl px-4 py-[0.95rem] min-h-[140px] resize-y transition-[border-color,box-shadow,background-color] duration-150 focus:border-[#00f068]/55 focus:bg-[rgba(255,255,255,0.045)] focus:outline-none focus:ring-2 focus:ring-[#00f068]/22"
          {...props}
        />
      {errors?.map((error) => (
          <span key={error} className="text-rose-300 text-[0.84rem]">{error}</span>
      ))}
    </label>
  );
}