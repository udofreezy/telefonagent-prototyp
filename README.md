# Die Zahnärzte – KI-Telefonassistent

KI-Telefonagent für **[Die Zahnärzte](https://diezahnaerzte.ch)** – das Zahnärzte-Netzwerk in
Basel, Riehen, Birsfelden und Bad Säckingen. Der Agent nimmt eingehende Anrufe entgegen,
beantwortet Fragen zu Behandlungen und Standorten, betreut Angst- und Kinderpatienten einfühlsam
und vereinbart Termine – am Standort Basel SBB rund um die Uhr, 365 Tage im Jahr.

Gebaut mit [Next.js](https://nextjs.org) (App Router) und [Vapi](https://vapi.ai) für Telefonie,
Sprache (Cartesia) und Transkription (Deepgram). Das Sprachmodell ist Claude (Anthropic).

## Funktionen

- **Telefonassistent**: Begrüssung, Beratung zu allen Behandlungen und Standorten, Terminvereinbarung,
  Notfall- und Angstpatienten-Betreuung, Rückrufnotizen – auf natürlichem, schweizernahem Hochdeutsch.
- **Dashboard** (`/`): Agent in 5 Schritten konfigurieren (Branche, Begrüssung, Services, Zeiten,
  Stimme) und aktivieren. Die Zahnärzte ist als Standard-Vorlage hinterlegt.
- **Anrufprotokoll** (`/calls`): alle Anrufe mit Zusammenfassung, Transkript und strukturierten Daten.
- **Kalender** (`/calendar`) & **Termine**: vom Agenten vereinbarte Termine.
- **Patientenstamm** (`/customers`): optionale Patientendatenbank (Behandlungshistorie, Allergien,
  Versicherung), die in den Agent-Prompt einfliesst.

## Standorte

| Standort | Adresse | Telefon | Öffnungszeiten |
| --- | --- | --- | --- |
| Basel SBB (Hauptpraxis) | Centralbahnstrasse 20, 4051 Basel | 061 227 70 70 | Mo-Fr 7-21, Sa 8-20, So/Feiertage 10-16 (365 Tage) |
| Riehen Bahnhof | Bahnhofstrasse 25, 4125 Riehen | 061 641 11 15 | Mo-Fr 8-20, Sa 8-14 |
| Riehen Schmiedgasse (Zahnhase) | Schmiedgasse 23, 4125 Riehen | 061 641 68 00 | Mo-Fr 8-19 |
| Birsfelden | Kirchstrasse 4, 4127 Birsfelden | 061 311 24 24 | Mo-Fr 8-12, 13-18 |
| Bad Säckingen (DE) | Wernergasse 6, D-79713 Bad Säckingen | +49 7761 93 88 88 | Mo-Do 8-18, Fr 8-16 |

## Konfiguration der Prompts

Die gesamte Agent-Persönlichkeit und das Branchen-Wissen liegen in:

- `src/lib/templates.ts` – die Branchen-Vorlage `zahnarzt` (System-Prompt, Begrüssung, Standorte,
  Services, Öffnungszeiten, Preise) sowie die globalen Sprach- und Gesprächsführungs-Richtlinien.
- `src/lib/vapi.ts` – Vapi-Assistant-Konfiguration: Stimme, Transkription, zahnmedizinische
  Erkennungs-Keywords, Gesprächs-Zusammenfassung und strukturierte Datenextraktion.

Weitere Branchen-Vorlagen (z.B. Ästhetische Medizin, Restaurant, Reinigung) stehen als Presets
im Dashboard zur Verfügung, falls der Agent für einen anderen Standort/Use-Case getestet werden soll.

## Branding

- Logo & Farben orientieren sich an [diezahnaerzte.ch](https://diezahnaerzte.ch) (Primärfarbe `#1f90b2`,
  Akzent `#55c1e2`). Assets liegen in `public/dz-icon.png` (Icon) und `public/dz-logo.svg` (Wortmarke).

## Lokale Entwicklung

```bash
npm install
cp .env.local.example .env.local   # Werte eintragen
npm run dev
```

Dann [http://localhost:3000](http://localhost:3000) öffnen.

## Environment-Variablen

| Variable | Beschreibung |
| --- | --- |
| `VAPI_API_KEY` | API-Key aus dem [Vapi Dashboard](https://dashboard.vapi.ai) |
| `VAPI_PHONE_NUMBER_ID` | ID der Telefonnummer, die dem Agent zugewiesen wird |
| `VAPI_WEBHOOK_SECRET` | (optional) zum Verifizieren von Vapi-Webhooks |
| `NEXT_PUBLIC_BASE_URL` | Öffentliche URL für Webhooks (in Produktion die Vercel-URL) |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | (optional) Upstash Redis für persistente Speicherung in Produktion |

Ohne Redis werden Daten lokal im Ordner `data/` als JSON gespeichert.

## Deployment

Auf [Vercel](https://vercel.com) deployen, die Environment-Variablen setzen und
`NEXT_PUBLIC_BASE_URL` auf die Produktions-URL zeigen lassen, damit Vapi-Webhooks ankommen.
