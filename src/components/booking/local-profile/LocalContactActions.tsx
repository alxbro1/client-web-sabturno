import type { SVGProps } from "react";
import { Navigation, Phone } from "lucide-react";

interface LocalContactActionsProps {
  whatsappUrl: string | null;
  telUrl: string | null;
  instagramUrl: string | null;
  mapsUrl: string | null;
}

// lucide-react has no brand icons (WhatsApp/Instagram were dropped from the
// package); these are small inline outline glyphs matching its stroke style.
function WhatsappIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M3 21l1.65-4.95A8 8 0 1 1 9 20.35Z" />
      <path d="M8.5 9.5c0 3 2.5 5.5 5.5 5.5 1 0 1.3-.6 1.2-1.2l-.3-1.3-1.9-.5-1 1c-1-.6-1.8-1.4-2.4-2.4l1-1-.5-1.9-1.3-.3c-.6-.1-1.3.2-1.3 1.2Z" />
    </svg>
  );
}

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
  telUrl,
  instagramUrl,
  mapsUrl,
}: LocalContactActionsProps) {
  const actions: ContactAction[] = [];

  if (whatsappUrl) {
    actions.push({
      key: "whatsapp",
      href: whatsappUrl,
      label: "WhatsApp",
      icon: <WhatsappIcon className="size-5" />,
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
  if (telUrl) {
    actions.push({
      key: "tel",
      href: telUrl,
      label: "Llamar",
      icon: <Phone className="size-5" />,
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
    <div className="grid grid-cols-4 gap-3">
      {actions.map((action) => {
        const isTel = action.key === "tel";
        return (
          <a
            key={action.key}
            href={action.href}
            {...(!isTel ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            aria-label={action.label}
            className="flex flex-col items-center gap-1.5"
          >
            <span
              className={`${ACTION_BUTTON_CLASS} ${action.tinted ? PRIMARY_TINT_CLASS : NEUTRAL_CLASS}`}
            >
              {action.icon}
            </span>
            <span className="text-xs font-medium text-muted-foreground">{action.label}</span>
          </a>
        );
      })}
    </div>
  );
}
