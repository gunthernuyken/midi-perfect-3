# MIDI PERFECT 3

Multi-Lane MIDI-Generator in **einer** HTML-Datei. Doppelklick, läuft — kein
Build, kein Server, keine Abhängigkeit, kein CDN.

**Nur Chrome oder Edge.** Web MIDI ist in Safari und Firefox nicht
implementiert; ohne Web MIDI gibt es keine Klangausgabe.

---

## Was sich gegenüber MIDI PERFECT 2 ändert

Version 2 war eine einzige, endlos scrollende Kachelseite. Beim Spielen hieß
das: Transport und Takt-Anzeige sind weg, sobald man irgendetwas verstellt.

Version 3 ist dieselbe Anwendung als **Werkzeug mit Bereichen**:

| Zone | Verhalten |
|---|---|
| Transportleiste oben | scrollt nie weg — Play/Stop/Reroll, Takt-Zähler, Beat-Punkte, Lane-Schalter, Setup-Knopf |
| Seitenleiste links | sieben Bereiche, einklappbar auf reine Symbole |
| Inhalt | genau ein Bereich sichtbar, passt bei 1440 × 900 **ohne Scrollen** |
| Klaviatur unten | auf allen Bereichen sichtbar, einklappbar |

### Die sieben Bereiche

1. **MIDI & Transport** — Ausgang, Kanal-Routing, Tempo/Swing/Humanize/Energy/Complexity, Loop, Infinity-Mutation, Protokoll
2. **Song** — Akkordfolge, Takt-Kacheln mit Sperre, Quintenzirkel, Stufen, Vorschläge, Reharmonisierung, Generator
3. **Blues-Werkstatt** — Form, Turnaround, Transposition, Tempofelder, Chorus-Bogen
4. **Lanes** — Band-Presets und die fünf Lanes
5. **Sync** — MIDI Clock, Slave, MMC, Cubase-Optionen
6. **Export & Setups** — SMF-Export, Setup-Verwaltung
7. **Monitor** — Kanal-Belegung, Protokoll, MIDI-Monitor

### Tastatur

| Taste | Wirkung |
|---|---|
| `Leertaste` | Play / Stop |
| `1` – `5` | Lane an/aus |
| `⇧1` – `⇧5` | Solo |
| `R` | Reroll aller nicht gesperrten Lanes |
| `D` | alle Styles würfeln |
| `⌥1` – `⌥7` | Bereich wechseln |
| `⌘S` / `Strg+S` | Setup speichern |

Die blanken Ziffern gehören weiterhin den Lanes — das ist eingeübt und wird
beim Spielen gebraucht. Bereiche liegen deshalb auf Alt/Option.

---

## Aufgeräumt

- **Eine Transportleiste statt zwei.** Version 2 hatte Kommandoleiste *und*
  Transport-Panel, abgeglichen von einer `requestAnimationFrame`-Schleife, die
  60-mal pro Sekunde Textinhalte verglich. Beides entfällt.
- **Eine Tonart statt drei.** `keyPc` (Song), `blKey` (Blues-Form) und `blTo`
  (Transpositionsziel) meinten dasselbe und liefen auseinander, sobald man
  eines davon anfasste. Sie sind jetzt aneinander gebunden.
- **Ein Protokoll statt zwei.** Das Log-Element wandert beim Bereichswechsel in
  die sichtbare Ansicht, statt gedoppelt und synchron gehalten zu werden.
- **Selten Genutztes hinter „Erweitert"** — MMC-Gerät, Transportbefehl,
  Lane-Zustand zurücksetzen, die langen Hilfetexte.

## Behobene Fehler aus Version 2

- **`TYPESUF` war zweimal deklariert.** Die zweite Deklaration in der
  Blues-Werkstatt überschrieb die erste zur Laufzeit und kannte `m7b5`, `dim`,
  `aug`, `sus4`, `6`, `m6`, `7#9` und `sus2` nicht. Stufenanzeige und
  Vorschläge schrieben deshalb `C#undefined`. Die Blues-Variante heißt jetzt
  `BLUESSUF`.
- **Zustandszeichen zeigten in beide Richtungen.** `● CLOCK OFF`,
  `● SLAVE OFF`, `● INFINITY OFF` und `✓ Tempo/Swing übernehmen` (im
  ausgeschalteten Zustand) — der gefüllte Punkt stand auf AUS-Schaltern. Jetzt
  gilt durchgehend: **● = an, ○ = aus.**
- **„Septakkorde" tauschte beim Umschalten das Wort statt des Zustands**
  (`● Septakkorde` ↔ `○ Dreiklänge`). Ein Schalter, dessen Beschriftung
  wechselt, ist keiner.
- **41 Schalter waren `<span>`** und damit für die Tastatur nicht vorhanden —
  SOLO und die Lane-Sperre ließen sich ohne Maus überhaupt nicht bedienen.
  Eigene Schalter sind jetzt `<button>`, die von der Engine erzeugten werden
  beim Aufbau mit `role="switch"` und `tabindex` nachgerüstet.
- **Der gekoppelte Swing-Wert stand bei 1,58 : 1.** Ein deaktiviertes Feld, das
  eine *Auskunft* trägt, wird nicht abgeblendet — es ist jetzt als nicht
  editierbar gezeichnet (versenkte Fläche, gestrichelte Kante, 8 : 1).
- **Kontrastkorrekturen quer durch das Bestandsdesign:** Protokolltext von
  2,94 → 10,78; Feld-Etiketten von 4,39 → 7,29; die Grenze aller
  Bedienelemente von 2,08 → 4,46; Play-Knopf 1,77 → 10,71. Die fünf
  Lane-Identitätsfarben bleiben unangetastet.

---

## Was die Engine ist und was nicht

Die gesamte Klangerzeugung ist **unverändert aus Version 2 übernommen**:
Generatoren, Voicing-Aufbau, Swing- und Humanize-Rechnung, Scheduler, Web-MIDI-
Schicht, Clock/Slave, SMF-Export, Setup-Speicher. Umbauen und Umbenennen
gleichzeitig ist die Art von Änderung, bei der man hinterher nicht mehr weiß,
welcher Teil den Fehler hat.

Neu sind ausschließlich: das Markup der sieben Bereiche, das Gestaltungssystem
und eine dünne Hüllenschicht (Router, Klappzustände, Reglerfüllung,
Tonart-Kopplung). Sie greift nie in die Erzeugung von Noten ein.

Ein automatischer Abgleich prüft beim Bauen, dass die Hülle **jede** der 133
Element-IDs bereitstellt, die die Engine anspricht. Fehlt eine, bricht der Bau
ab, statt zur Laufzeit still danebenzugreifen.

## Speicher

Eigener Namensraum `midiperfect3.*` — Version 2 bleibt vollständig unberührt
und behält ihre Setups, Lane-Zustände und Sync-Einstellungen.

| Schlüssel | Inhalt |
|---|---|
| `midiperfect3.setups.v1` | benannte Setups |
| `midiperfect3.setup.auto` | Schnappschuss beim Schließen |
| `midiperfect3.setup.meta` | zuletzt gespeichert, Autoload |
| `midiperfect3.lanes.v1` | Lane-Zustand |
| `midiperfect3.sync.v2` | Clock/Slave/MMC |
| `midiperfect3.lang` | DE / EN |
| `midiperfect3.ui.v1` | Bereich, Seitenleiste, Klaviatur-Dock |

---

## Werkstatt

`werkstatt/` enthält die Quellen, aus denen `MIDI PERFECT 3.html`
zusammengesetzt wird. Für den Betrieb wird davon **nichts** gebraucht — die
ausgelieferte Datei steht für sich allein.

| Datei | Inhalt |
|---|---|
| `build.py` | setzt die Engine aus Version 2 mit der neuen Hülle zusammen, wendet die Fehlerkorrekturen an, prüft den ID-Abgleich |
| `mp3.css` | Design-System: Tokens, Raster, Bedienelemente |
| `compat.css` | legt die Klassennamen der Engine auf diese Tokens |
| `layout.css` | Dichte-Korrekturen, jede mit gemessener Begründung |
| `body.html` | Markup der sieben Bereiche |
| `shell.js` | Router, Klappzustände, Reglerfüllung, Tonart-Kopplung |
| `SPEC.md` | Layout-Spezifikation mit Höhenbudget und Kontrastprüfung |
| `KRITIK.md` | Gestaltungskritik am gebauten Ergebnis |

Neu bauen: `python3 build.py` (erwartet `MIDI PERFECT 2.html` unter dem im
Skript gesetzten Pfad).
