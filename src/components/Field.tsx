import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Shared props for all field variants                               */
/* ------------------------------------------------------------------ */
type SharedProps = {
  label: string;
  errors?: string[];
  hint?: string;
  trailing?: ReactNode;
};

/* ------------------------------------------------------------------ */
/*  InputField                                                         */
/* ------------------------------------------------------------------ */
export function InputField({
  label,
  errors,
  hint,
  trailing,
  className,
  id,
  ...props
}: SharedProps & InputHTMLAttributes<HTMLInputElement>) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={fieldId}>{label}</Label>

      <div className="relative">
        <Input id={fieldId} className={className} {...props} />
        {trailing && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {trailing}
          </div>
        )}
      </div>

      {hint && !errors?.length && (
        <p className="text-sm text-muted-foreground">{hint}</p>
      )}

      {errors?.map((error) => (
        <p key={error} className="text-sm text-destructive">
          {error}
        </p>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SelectField                                                        */
/* ------------------------------------------------------------------ */
export function SelectField({
  label,
  errors,
  hint,
  children,
  className,
  id,
  ...props
}: SharedProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={fieldId}>{label}</Label>

      <select
        id={fieldId}
        className={cn(
          // Misma apariencia que Input — border, ring, bg, shadow
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] md:text-sm",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "aria-invalid:border-destructive",
          className,
        )}
        {...props}
      >
        {children}
      </select>

      {hint && !errors?.length && (
        <p className="text-sm text-muted-foreground">{hint}</p>
      )}

      {errors?.map((error) => (
        <p key={error} className="text-sm text-destructive">
          {error}
        </p>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TextareaField                                                      */
/* ------------------------------------------------------------------ */
export function TextareaField({
  label,
  errors,
  hint,
  className,
  id,
  ...props
}: SharedProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={fieldId}>{label}</Label>

      <Textarea id={fieldId} className={className} {...props} />

      {hint && !errors?.length && (
        <p className="text-sm text-muted-foreground">{hint}</p>
      )}

      {errors?.map((error) => (
        <p key={error} className="text-sm text-destructive">
          {error}
        </p>
      ))}
    </div>
  );
}
