# Changelog

Versionsschema: `BUILD YYYY-MM-DD-X` — Datum plus Buchstabe für mehrere
Stände pro Tag. Die Build-Kennung steht links oben in der Seitenleiste.

## BUILD 2026-08-01-J — Taktwechsel an der Taktgrenze

**Problem:** Hinterlegung und Scroll-Schub wechselten erst mit dem ersten
Note-On des neuen Takts. Liegt die erste Note auf Schlag 2 oder später,
hinkte die Anzeige hinterher.

**Ursache:** Der Taktwechsel wurde aus den Noten-Ereignissen abgeleitet —
zwischen Noten wusste die Anzeige nichts von der Zeit.

**Geändert:** Der Taktwechsel wandert in die Playhead-Schleife, die die
Scheduler-Position kontinuierlich liest — Umschalten exakt an der
Taktgrenze. Beim Transport-Neustart wird das Raster zurückgesetzt, statt
im Scroll-Modus weiterzuschieben.

**Gemessen** headless: Umschaltpunkte bei 2–3 % des neuen Takts
(Abtastraster 60 ms), vorher abhängig von der ersten Note.

## BUILD 2026-08-01-I — Setup speichern mit Feedback, Laden an der Leiste

**Problem:** Der Setup-Knopf in der Transportleiste speicherte stumm — die
Bestätigung stand nur im Protokoll, das im gerade sichtbaren Bereich selten
zu sehen ist. „Macht gefühlt nichts." Laden gab es ausschließlich im
Bereich Export & Setups.

**Geändert**
- Speichern (Knopf wie Cmd/Strg+S) blinkt am Knopf: **✓ Gespeichert**
- neuer Knopf **📂 Laden** daneben öffnet ein Menü der gespeicherten
  Setups; Klick lädt und bestätigt mit **✓ Geladen**
- Engine unangetastet — die Hülle nutzt `readSetups()`/`loadSetupByName()`

## BUILD 2026-08-01-H — Playhead in der Tabulatur

**Problem:** Weder im Fenster- noch im Scroll-Modus war zu sehen, wo sich
die gerade gespielte Note befindet.

**Ursachen:** Die Hinterlegung des laufenden Takts stand bei 7 % Deckung —
praktisch unsichtbar. Dazu zwei handfeste Fehler: ein Inline-`--bar:0` auf
der Hinterlegung überstimmte die Positionsangabe des Elternelements (der
Balken klebte immer auf Takt 1), und ein defektes Zeichen im Stylesheet
verhinderte `position:relative` auf dem Raster — die Überlagerungen
ankerten am Viewport statt an der Tabulatur.

**Geändert**
- **Playhead:** eine rAF-Schleife liest die Scheduler-Position (dieselbe
  Interpolation wie `schedTick`, auch im Clock-Slave gültig) und führt eine
  leuchtende Linie durch das Raster; blendet bei Stop und Count-In aus
- Takt-Hinterlegung auf 14 % Deckung mit Seitenkanten, beide Fehler behoben

**Getestet** headless über Playwright: Linie wandert (zwei Messpunkte),
steht im Scroll-Modus im Mittelblock, verschwindet bei Stop.

## BUILD 2026-08-01-G — Vorschau in der Tabulatur

**Problem:** Die rechte Hälfte des Scroll-Modus blieb konstruktionsbedingt
leer — was kommt, kannte die Anzeige erst beim Note-On. Zum Mitspielen
braucht man Lesevorsprung.

**Geändert**
- Beide Modi zeichnen Kommendes **gedimmt** aus den bereits generierten
  Loop-Events (`sched.ev`); beim echten Note-On wird die Zahl fest
- Fenster-Modus: das ganze 8-Takte-Fenster erscheint sofort als Vorschau;
  Scroll-Modus: laufender Takt plus drei Folgetakte, am Loop-Ende läuft die
  Vorschau in den Anfang des nächsten Chorus weiter
- Gedimmt Stehendes wurde geplant, aber nicht gespielt (Lane aus) — das
  bleibt bewusst als Information stehen

## BUILD 2026-08-01-F — Scroll-Modus

**Geändert:** Umschalter ▦ Fenster / ⇄ Scroll in der Dock-Leiste. Scroll
schiebt pro Taktwechsel alles einen Takt nach links, der laufende Takt
steht fest in der Mitte, links die Historie; der Loop-Neustart scrollt
nahtlos weiter. Modus wird in `midiperfect3.ui.v1` gespeichert.

## BUILD 2026-08-01-E — 8-Takte-Fenster

**Geändert:** Tabulatur zeigt 8 Takte im **Achtel-Raster** statt eines
Takts in 16teln — 128 16tel-Spalten wären für zweistellige Bundzahlen zu
eng. Zwei 16tel im selben Achtel stehen nebeneinander in der Zelle.
Kräftige Striche markieren Taktanfänge, feine die Viertel.

## BUILD 2026-08-01-D — Tabulatur über die volle Breite

**Geändert:** Klaviatur kompakt links (scrollt intern), Tabulatur nimmt die
Restbreite. Bundzahlen sitzen auf der Saitenlinie (kleiner Backdrop, wie im
gedruckten Tab), statt die Linie zu unterbrechen.

## BUILD 2026-08-01-C — Tabulatur und Lane-Filter

**Geändert**
- Tabulatur-Dock neben der Klaviatur, Standard-Stimmung e B G D A E;
  Saitenwahl: kleinster Bund, freie Saite bevorzugt, Bass wird in den
  Griffbereich oktaviert, Drums als × auf der E-Zeile
- Lane-Filter für Klaviatur und Tabulatur getrennt (fünf Schalter je
  Anzeige); sie filtern nur die Anzeige, nicht den Klang
- Engine-Durchreiche: der Visual-Timer übergibt Lane-Nummer und Tick an die
  Hülle (`MP3TAB`), zeitgenau zum hörbaren Note-On

## BUILD 2026-08-01-B — Timing im Hintergrund

**Problem:** Synchronisation ruckelte, sobald Cubase den Fokus hatte.

**Ursache:** Chrome drosselt `setInterval` in Hintergrund-Tabs auf ≥ 1 s.
Der 20-ms-Scheduler-Tick verhungerte, die 220-ms-Queue lief leer.

**Geändert**
- Tick-Quelle in einen **Web Worker** (von der Drosselung ausgenommen),
  `setInterval` als Rückfallebene mit Warnung im Protokoll
- Lookahead im Hintergrund 220 → 600 ms; Stop und Tempoänderung sind
  Vordergrund-Aktionen und behalten die kurze Queue
- Klaviatur-Beleuchtung und Taktzähler pausieren bei verstecktem Tab
  (vorher zwei `setTimeout` pro Note plus DOM-Arbeit, die niemand sieht)

**Getestet** headless: Ausgabe läuft bei simuliertem `document.hidden`
ununterbrochen weiter, Lookahead schaltet um und zurück.

## BUILD 2026-08-01-A — Erstausgabe

Bereiche statt Endlosseite: feste Transportleiste, sieben Bereiche in der
Seitenleiste, jeder passt bei 1440 × 900 ohne Scrollen. Engine 1:1 aus
MIDI PERFECT 2; behobene V2-Fehler und Aufräumarbeiten in der README.
