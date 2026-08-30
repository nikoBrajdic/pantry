import type { Difficulty, Pace } from "./types";

export const RECIPE_TAGS = [
  { id: "piletina", label: "Piletina" },
  { id: "govedina", label: "Govedina" },
  { id: "svinjetina", label: "Svinjetina" },
  { id: "janjetina", label: "Janjetina" },
  { id: "riba", label: "Riba" },
  { id: "morski-plodovi", label: "Morski plodovi" },
  { id: "vegetarijansko", label: "Vegetarijansko" },
  { id: "vegansko", label: "Vegansko" },
  { id: "bez-glutena", label: "Bez glutena" },
  { id: "dorucak", label: "Doručak" },
  { id: "rucak", label: "Ručak" },
  { id: "vecera", label: "Večera" },
  { id: "uzina", label: "Užina" },
  { id: "desert", label: "Desert" },
  { id: "kruh", label: "Kruh" },
  { id: "pecivo", label: "Pecivo" },
  { id: "pica", label: "Pića" },
  { id: "tjestenina", label: "Tjestenina" },
  { id: "riza", label: "Riža" },
  { id: "juha", label: "Juha" },
  { id: "salata", label: "Salata" },
  { id: "povrce", label: "Povrće" },
  { id: "pecnica", label: "Pećnica" },
  { id: "grill", label: "Grill" },
  { id: "jedan-lonac", label: "Jedan lonac" },
  { id: "meal-prep", label: "Meal prep" },
  { id: "ljuto", label: "Ljuto" },
  { id: "utesna", label: "Utešna hrana" },
] as const;

export type TagId = (typeof RECIPE_TAGS)[number]["id"];

export const DIFFICULTY_OPTIONS: { id: Difficulty; label: string; hint: string }[] = [
  { id: "easy", label: "Lako", hint: "Malo koraka, teško pogriješiti" },
  { id: "moderate", label: "Srednje", hint: "Treba malo pažnje ili vremena" },
  { id: "complicated", label: "Komplicirano", hint: "Više tehnika ili duga priprema" },
];

export const PACE_OPTIONS: { id: Pace; label: string; hint: string }[] = [
  { id: "quick", label: "Brzo", hint: "Otprilike do 35 minuta" },
  { id: "time-consuming", label: "Dugo traje", hint: "Sporo kuhanje, dizanje, hlađenje…" },
];

export function tagLabel(id: string) {
  return RECIPE_TAGS.find((tag) => tag.id === id)?.label ?? id;
}
