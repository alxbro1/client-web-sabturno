---
name: react-shadcn-branding
description: Use this skill for all rebranding, design system creation, UI consistency and visual improvement tasks in React projects using shadcn/ui + Tailwind. Triggers: rebranding, redesign components, improve UI attractiveness, design system, branding, design tokens, shadcn theme, inconsistent design, modern UI, visual audit, brand identity.
---

# React + Shadcn/UI Branding & Design System

**Objetivo principal**: Transformar componentes React feos o inconsistentes en un sistema de diseño profesional, coherente y atractivo usando **shadcn/ui + Tailwind CSS**.

## Cuándo usar esta skill
- Auditoría visual de componentes o páginas
- Rebranding completo de una web/app
- Crear o mejorar un Design System
- Generar theme consistente (colores, tipografía, spacing, shadows, etc.)
- Mejorar armonía entre diferentes secciones/páginas
- Migrar de componentes básicos a shadcn/ui profesional

## Flujo de Trabajo Recomendado (siempre sigue este orden)

1. **Auditoría Inicial**
   - Analiza los componentes actuales (colores hardcodeados, estilos inconsistentes, tipografía, spacing)
   - Identifica la marca actual (colores primarios, personalidad, público objetivo)

2. **Definir Brand Identity**
   - Elige o propone paleta de colores (primario, secundario, accent, neutral, semantic)
   - Selecciona combinaciones de fuentes (Google Fonts recomendadas para shadcn)
   - Define tono de voz y estilo visual (minimal, bold, corporate, playful, etc.)

3. **Configuración Técnica (Shadcn + Tailwind)**
   - Genera `tailwind.config.js` optimizado
   - Crea `globals.css` con variables CSS modernas
   - Configura `components.json` de shadcn
   - Define Design Tokens (usando CSS variables)

4. **Implementación**
   - Actualiza componentes existentes a shadcn/ui
   - Aplica theme consistente
   - Mejora layouts, spacing, hover states, focus rings, etc.
   - Añade micro-interacciones y polish

5. **Validación y Refinamiento**
   - Revisa consistencia en todas las páginas
   - Prueba responsividad y accesibilidad
   - Genera `DESIGN.md` con documentación del sistema

## Recursos de Referencia (usa webfetch o browser tools)

**Tipografía y Pairings**:
- fontpair.co
- typespiration.com
- fontsinuse.com

**Inspiración UI/Branding**:
- awwwards.com (filtra React/modern)
- mobbin.com
- dribbble.com (busca "shadcn ui", "saas dashboard", "brand system")
- refero.design
- rebrand.gallery
- underconsideration.com/brand-new

**Design Systems para estudiar**:
- Vercel Geist
- shadcn/ui official examples
- Linear.app, Vercel.com, Raycast, Stripe

**Herramientas de Colores**:
- coolors.co
- huemint.com
- adobe color

## Templates Recomendados (genera estos archivos)

### 1. tailwind.config.js (ejemplo base)
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... secondary, accent, destructive, etc.
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Space Grotesk", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}