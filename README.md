# Clickfabrik – KI-Telefonassistent

KI-Telefonagent für **[Clickfabrik](https://www.clickfabrik.ch)** – die Digitalagentur aus Basel.
Der Agent nimmt eingehende Anrufe rund um die Uhr entgegen, beantwortet Fragen zu den
Dienstleistungen, qualifiziert Leads und vereinbart kostenlose Erstgespräche (10–15 Min.).

Gebaut mit [Next.js](https://nextjs.org) (App Router) und [Vapi](https://vapi.ai) für Telefonie,
Sprache (Cartesia) und Transkription (Deepgram). Das Sprachmodell ist Claude (Anthropic).

## Funktionen

- **Telefonassistent**: Begrüssung, Beratung zu allen Clickfabrik-Leistungen, Lead-Qualifizierung,
  Terminvereinbarung und Rückrufnotizen – auf natürlichem, schweizernahem Hochdeutsch.
- **Dashboard** (`/`): Agent in 5 Schritten konfigurieren (Branche, Begrüssung, Services, Zeiten,
  Stimme) und aktivieren. Clickfabrik ist als Standard-Vorlage hinterlegt.
- **Anrufprotokoll** (`/calls`): alle Anrufe mit Zusammenfassung, Transkript und strukturierten Daten.
- **Kalender** (`/calendar`) & **Termine**: vom Agenten vereinbarte Erstgespräche.
- **Kundenstamm** (`/customers`): optionale Kundendatenbank, die in den Agent-Prompt einfliesst.

## Konfiguration der Prompts

Die gesamte Agent-Persönlichkeit und das Branchen-Wissen liegen in:

- `src/lib/templates.ts` – die Branchen-Vorlage `clickfabrik` (System-Prompt, Begrüssung,
  Services, Öffnungszeiten, Preise) sowie die globalen Sprach- und Gesprächsführungs-Richtlinien.
- `src/lib/vapi.ts` – Vapi-Assistant-Konfiguration: Stimme, Transkription, Erkennungs-Keywords,
  Gesprächs-Zusammenfassung und strukturierte Datenextraktion.

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
