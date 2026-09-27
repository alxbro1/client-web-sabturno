/**
 * `Service.category` is free text, and two writers disagree on its format:
 * the mobile form (`app/src/features/service/configs/serviceFormConfig.ts`)
 * stores English slugs, and the web form stores Spanish names without accents.
 * Translate both at display time so existing and future rows read correctly.
 */
const CATEGORY_LABELS: Record<string, string> = {
  // Mobile app slugs.
  haircuts: "Cortes de cabello",
  coloring: "Coloración",
  treatments: "Tratamientos",
  nails: "Manicura/Pedicura",
  massage: "Masajes",
  waxing: "Depilación",
  other: "Otros",
  // Web form values, stored without accents.
  peluqueria: "Peluquería",
  barberia: "Barbería",
  estetica: "Estética",
  depilacion: "Depilación",
  "cejas y pestanas": "Cejas y pestañas",
};

export function serviceCategoryLabel(category: string | null | undefined): string {
  const trimmed = category?.trim() ?? "";
  return CATEGORY_LABELS[trimmed.toLowerCase()] ?? trimmed;
}
