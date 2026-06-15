import type { Metadata } from "next";
import { Space_Grotesk, Manrope } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { QueryProvider } from "@/components/QueryProvider";
import "@/styles.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SabTurno - Reservas online",
    template: "%s | SabTurno",
  },
  description:
    "Reserva turnos en peluquerías y negocios de servicios. Gestiona tus citas de forma fácil y rápida.",
  keywords: ["reservas", "turnos", "peluquería", "servicios", "citas"],
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "SabTurno",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${spaceGrotesk.variable} ${manrope.variable}`}
      suppressHydrationWarning
    >
      <body>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
