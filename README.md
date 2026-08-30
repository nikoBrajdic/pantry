# Receptoteka

Aplikacija za sažimanje i čuvanje recepata. Zalijepiš link, izvuče sastojke, broj porcija i upute. Možeš preračunati količine prema porcijama ili prema sastojku koji imaš, označiti tagove i težinu, upozoriti da se jelo jede sljedeći dan, potražiti recept po onome što je u frižideru i podijeliti knjižnicu s partnerom.

## Što možeš raditi

- **Dodaj iz linka** — na stranici Dodaj zalijepi URL recepta. Aplikacija čita uobičajene receptne stranice (schema.org / JSON-LD). Ako stranica ne da podatke, unesi recept ručno.
- **Preračunaj** — na receptu biraj broj porcija, ili upiši koliko jednog sastojka imaš. Ostale količine se prilagode.
- **Tagovi i oznake** — piletina, govedina, doručak, desert, kruh, pića… plus lako / srednje / komplicirano i brzo / dugo traje. Tu je i upozorenje „najbolje sljedeći dan“.
- **Što imam** — upiši sastojke iz kuće, knjižnica predloži najbolje poklapanje.
- **Podijeli** — otvori kućanstvo i pošalji kod partneru, ili pošalji jedan recept linkom.

Na početku su u knjižnici četiri primjera da odmah vidiš kako radi pretraga i preračunavanje.

## Pokretanje

Treba ti [Node.js](https://nodejs.org/) 20 ili noviji.

```bash
npm install
npm run dev
```

Otvori [http://127.0.0.1:43147](http://127.0.0.1:43147).

## Dijeljenje

Recepti se čuvaju u pregledniku (localStorage). Zajednički kod kućanstva sinkronizira knjižnicu preko poslužitelja na kojem aplikacija radi. Jedan recept možeš uvijek poslati linkom, bez koda.

Ako aplikaciju objaviš na Vercelu, kod kućanstva neće trajno pamtiti podatke (serverless nema trajnu datoteku). Link za jedan recept i dalje radi.

## Tehnologija

Next.js, TypeScript, Tailwind CSS i shadcn/ui. Nema prijave ni baze — namjerno, da se može odmah koristiti.
