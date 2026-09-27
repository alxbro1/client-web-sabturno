import type { SVGProps } from "react";
import { Navigation } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";

interface LocalContactActionsProps {
  whatsappUrl: string | null;
  instagramUrl: string | null;
  mapsUrl: string | null;
}

// lucide-react has no brand icons (WhatsApp/Instagram were dropped from the
// package). WhatsApp uses the official logo from react-icons; Instagram is a
// small inline outline glyph matching lucide's stroke style.
function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

const ACTION_BUTTON_CLASS =
  "grid size-13 place-items-center rounded-full outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50";
const PRIMARY_TINT_CLASS = "border border-primary/20 bg-primary/10 text-primary";
const NEUTRAL_CLASS = "border border-border bg-card text-foreground";

interface ContactAction {
  key: string;
  href: string;
  label: string;
  icon: React.ReactNode;
  tinted: boolean;
}

export function LocalContactActions({
  whatsappUrl,
  instagramUrl,
  mapsUrl,
}: LocalContactActionsProps) {
  const actions: ContactAction[] = [];

  if (whatsappUrl) {
    actions.push({
      key: "whatsapp",
      href: whatsappUrl,
      label: "WhatsApp",
      icon: <FaWhatsapp aria-hidden="true" className="size-6" />,
      tinted: true,
    });
  }
  if (instagramUrl) {
    actions.push({
      key: "instagram",
      href: instagramUrl,
      label: "Instagram",
      icon: <InstagramIcon className="size-5" />,
      tinted: false,
    });
  }
  if (mapsUrl) {
    actions.push({
      key: "maps",
      href: mapsUrl,
      label: "Cómo llegar",
      icon: <Navigation className="size-5" />,
      tinted: false,
    });
  }

  if (actions.length === 0) return null;

  return (
    <div className="flex justify-center gap-6">
      {actions.map((action) => (
        <a
          key={action.key}
          href={action.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={action.label}
          className="flex w-20 flex-col items-center gap-1.5"
        >
          <span
            className={`${ACTION_BUTTON_CLASS} ${action.tinted ? PRIMARY_TINT_CLASS : NEUTRAL_CLASS}`}
          >
            {action.icon}
          </span>
          <span className="text-xs font-medium text-muted-foreground">{action.label}</span>
        </a>
      ))}
    </div>
  );
}
