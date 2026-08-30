import type { Recipe } from "./types";
import { parseIngredientList } from "./ingredients";

function stamp(id: string, createdAt: string, rest: Omit<Recipe, "id" | "createdAt" | "updatedAt">): Recipe {
  return { id, createdAt, updatedAt: createdAt, ...rest };
}

export const SAMPLE_RECIPES: Recipe[] = [
  stamp("sample-piletina", "2026-01-12T10:00:00.000Z", {
    title: "Piletina s povrćem iz pećnice",
    servings: 4,
    ingredients: parseIngredientList([
      "800 g pilećih bataka",
      "2 crvene paprike",
      "1 tikvica",
      "1 crveni luk",
      "3 češnja češnjaka",
      "3 žlice maslinovog ulja",
      "1 limun",
      "1 žličica sušenog origana",
      "sol i papar po okusu",
    ]),
    instructions: [
      "Zagrij pećnicu na 200 °C.",
      "Batake osuši, posoli i popapri. Papriku, tikvicu i luk nareži na veće komade.",
      "Sve složi u vatrostalni pekač, dodaj zdrobljeni češnjak, origano, koru i sok limuna te maslinovo ulje.",
      "Ispeci 35–40 minuta, dok piletina ne porumeni i povrće ne omekša.",
      "Odmori 5 minuta i posluži s kruhom ili rižom.",
    ],
    tags: ["piletina", "rucak", "vecera", "pecnica", "jedan-lonac"],
    difficulty: "easy",
    pace: "quick",
    nextDay: false,
    notes: "Ako voliš hrskaviju kožicu, zadnjih 5 minuta prebaci na grill.",
  }),
  stamp("sample-kolac", "2026-02-03T18:20:00.000Z", {
    title: "Čokoladni kolač koji se hladi preko noći",
    servings: 8,
    ingredients: parseIngredientList([
      "200 g crne čokolade",
      "150 g maslaca",
      "150 g šećera",
      "4 jaja",
      "80 g brašna",
      "1 prstohvat soli",
      "1 žličica vanilije",
    ]),
    instructions: [
      "Otopi čokoladu i maslac na pari, pa ostavi da se malo ohlade.",
      "Muti jaja i šećer dok smjesa ne posvijetli. Ulij čokoladu, vaniliju i sol.",
      "Nježno umiješaj brašno i prelij u kalup 20–22 cm obložen papirom.",
      "Peci na 170 °C oko 25 minuta — sredina treba ostati malo vlažna.",
      "Potpuno ohladi, pa ostavi u hladnjaku preko noći. Tek sljedeći dan nareži.",
    ],
    tags: ["desert", "pecnica", "utesna"],
    difficulty: "moderate",
    pace: "time-consuming",
    nextDay: true,
    nextDayNote: "Kolač se mora potpuno ohladiti i odležati u hladnjaku. Najbolji je sljedeći dan.",
  }),
  stamp("sample-juha", "2026-03-08T12:00:00.000Z", {
    title: "Juha od rajčice s bosiljkom",
    servings: 4,
    ingredients: parseIngredientList([
      "1 kg zrelih rajčica",
      "1 luk",
      "2 češnja češnjaka",
      "2 žlice maslinovog ulja",
      "500 ml povrtne juhe",
      "1 žličica šećera",
      "hrpa svježeg bosiljka",
      "sol i papar",
    ]),
    instructions: [
      "Na ulju proprži sitno narezan luk dok ne staklasti, pa dodaj češnjak.",
      "Dodaj narezane rajčice, šećer, sol i papar. Kuhaj 10 minuta.",
      "Ulij juhu i kuhaj još 15 minuta.",
      "Izblendaj do glatkoće, pa umiješaj nasjeckani bosiljak.",
      "Posluži s kapi maslinovog ulja i tostim kruhom.",
    ],
    tags: ["juha", "vegetarijansko", "rucak", "vegansko", "povrce"],
    difficulty: "easy",
    pace: "quick",
    nextDay: false,
  }),
  stamp("sample-palacinke", "2026-04-01T08:30:00.000Z", {
    title: "Palačinke od ostataka iz frižidera",
    servings: 4,
    ingredients: parseIngredientList([
      "250 g brašna",
      "3 jaja",
      "500 ml mlijeka",
      "1 prstohvat soli",
      "1 žlica šećera",
      "20 g maslaca za prženje",
    ]),
    instructions: [
      "Umiješaj jaja, mlijeko, sol i šećer, pa postepeno dodaj brašno dok ne dobiješ glatku smjesu.",
      "Ostavi tijesto odmoriti 15 minuta.",
      "Prži tanke palačinke na maslacu, s obje strane, na srednje jakoj vatri.",
      "Posluži s džemom, nutellom ili sirom — što imaš u kući.",
    ],
    tags: ["dorucak", "uzina", "vegetarijansko"],
    difficulty: "easy",
    pace: "quick",
    nextDay: false,
  }),
];
