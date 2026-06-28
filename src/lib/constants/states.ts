export const stateIdByName = {
  "Ciudad Autónoma de Buenos Aires": "02",
  Neuquén: "58",
  "San Luis": "74",
  "Santa Fe": "82",
  "La Rioja": "46",
  Catamarca: "10",
  Tucumán: "90",
  Chaco: "22",
  Formosa: "34",
  "Santa Cruz": "78",
  Chubut: "26",
  Mendoza: "50",
  "Entre Ríos": "30",
  "San Juan": "70",
  Jujuy: "38",
  "Santiago del Estero": "86",
  "Río Negro": "62",
  Corrientes: "18",
  Misiones: "54",
  Salta: "66",
  Córdoba: "14",
  "Buenos Aires": "06",
  "La Pampa": "42",
  "Tierra del Fuego, Antártida e Islas del Atlántico Sur": "94",
} as const;

export type StateName = keyof typeof stateIdByName;

/** Lista ordenada alfabeticamente para usar en <SelectField>. */
export const STATE_NAMES: StateName[] = (Object.keys(stateIdByName) as StateName[]).sort(
  (a, b) => a.localeCompare(b, "es"),
);
