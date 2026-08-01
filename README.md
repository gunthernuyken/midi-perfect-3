# MIDI PERFECT 3

Multi-Lane MIDI-Generator in **einer** HTML-Datei. Doppelklick, läuft — kein
Build, kein Server, keine Abhängigkeit, kein CDN.

**Nur Chrome oder Edge.** Web MIDI ist in Safari und Firefox nicht
implementiert; ohne Web MIDI gibt es keine Klangausgabe.

**Live:** <https://gunthernuyken.github.io/midi-perfect-3/> — läuft direkt
im Browser, Setups bleiben lokal (localStorage, getrennt von der Datei-
Version).

| Dokument | Inhalt |
|---|---|
| [ARCHITEKTUR.md](ARCHITEKTUR.md) | Schichten, Bau, Scheduler, Tabulatur-System |
| [CHANGELOG.md](CHANGELOG.md) | Builds mit Problem/Ursache/Änderung |
| [CUBASE-SETUP.md](CUBASE-SETUP.md) | IAC, Spur-Routing, Clock/MMC, Fallen |
| [werkstatt/](werkstatt/) | Quellen, aus denen die HTML-Datei gebaut wird |

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
| Klaviatur + Tabulatur unten | auf allen Bereichen sichtbar, einklappbar, Lane-Filter je Anzeige |

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

## Timing im Hintergrund (Build 2026-08-01-B)

Chrome drosselt `setInterval` in Hintergrund-Tabs auf ≥ 1 Sekunde — genau
dann, wenn Cubase den Fokus hat. Der 20-ms-Scheduler-Tick verhungerte, die
220-ms-Queue lief leer: das war das Ruckeln beim Wechsel zur DAW.

- Der Tick kommt jetzt aus einem **Web Worker** — Worker-Timer sind von der
  Drosselung ausgenommen. Fällt die Worker-Erzeugung aus, greift
  `setInterval` als Rückfallebene (mit Warnung im Protokoll).
- Der Lookahead wächst im Hintergrund von 220 auf 600 ms. Stop und
  Tempoänderung sind Vordergrund-Aktionen — dort bleibt er kurz, damit beides
  sofort greift.
- Klaviatur-Beleuchtung und Taktzähler pausieren bei verstecktem Tab. Das
  waren zwei `setTimeout` pro Note plus DOM-Arbeit, die niemand sieht.

Empfehlung: Chromes „Speicher sparen" (Einstellungen → Leistung) für diese
Seite ausnehmen, sonst kann der Tab nach langer Inaktivität ganz eingefroren
werden — dagegen hilft auch kein Worker.

## Klaviatur & Tabulatur (Build 2026-08-01-C)

Das Dock unten teilt sich in Klaviatur (kompakt links, scrollt intern) und
**Tabulatur** über die restliche Breite. Die Tabulatur zeichnet ein Fenster
von **8 Takten** im Achtel-Raster in Standard-Stimmung (e B G D A E):
Bundzahlen erscheinen zeitgenau zum hörbaren Note-On auf der Saitenlinie,
der laufende Takt ist hinterlegt und ein **Playhead** führt als leuchtende
Linie durch das Raster (aus der Scheduler-Position berechnet, auch im
Clock-Slave korrekt). Kräftige Striche markieren Taktanfänge,
feine die Viertel. Zwei 16tel im selben Achtel stehen nebeneinander in der
Zelle. Der Umschalter neben den Tab-Filtern wählt zwischen zwei Modi
(gespeichert in `midiperfect3.ui.v1`):

| Modus | Verhalten |
|---|---|
| ▦ Fenster | 8 Takte füllen sich, geleert wird beim Eintritt ins nächste Fenster |
| ⇄ Scroll | pro Taktwechsel rückt alles einen Takt nach links; der laufende Takt steht fest in der Mitte, links die Historie |

**Vorschau:** Beide Modi zeichnen Kommendes **gedimmt** vor — die Engine
kennt den ganzen Take (`sched.ev`). Im Fenster-Modus erscheint das komplette
8-Takte-Fenster sofort als Vorschau, im Scroll-Modus der laufende Takt und
drei Folgetakte; am Loop-Ende läuft die Vorschau in den Anfang des nächsten
Chorus weiter. Beim echten Note-On wird die Zahl fest. Gedimmt Stehendes
wurde geplant, aber nicht gespielt (Lane aus) — auch das ist Information.
Nach Reroll/Mutation zieht die Vorschau beim nächsten Taktwechsel nach.

- **Lane-Filter je Anzeige:** fünf Schalter (Dr Ba Ch Ar Me) neben jeder
  Beschriftung. Sie filtern nur die *Anzeige* — was klingt, entscheidet
  weiterhin allein der Lane-Schalter im Transport. Voreinstellung:
  Klaviatur alle, Tabulatur alle außer Drums. Der Zustand überlebt den
  Reload (`midiperfect3.ui.v1`).
- **Saitenwahl:** kleinster Bund gewinnt; ist die Zelle belegt, weicht die
  Note auf die nächste freie Saite aus. Noten außerhalb des Griffbereichs
  (Bass!) werden oktaviert. Drums erscheinen als × auf der E-Zeile.
- Die Engine liefert die Ereignisse über den `MP3TAB`-Haken im Scheduler;
  die Klaviatur filtert über eine Hülle um `litKey`. Note-Off läuft
  ungefiltert, damit beim Abschalten keine Taste hängen bleibt.

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
