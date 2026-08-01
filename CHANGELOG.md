# Changelog

Versionsschema: `BUILD YYYY-MM-DD-X` — Datum plus Buchstabe für mehrere
Stände pro Tag. Die Build-Kennung steht links oben in der Seitenleiste.

## BUILD 2026-08-01-N — Cubase-Stop repariert, Akkordzeile mit Griffbildern

**Problem 1:** Cubase startete beim Play mit, reagierte aber nicht auf den
roten Stop-Knopf — nur der Sofortbefehl funktionierte.

**Ursache:** Wertekonflikt aus dem Markup-Umbau: das neue „Bei
STOP"-Auswahlfeld liefert `stop`/`none`, die Engine prüfte auf den alten
V2-Wert `'1'` — die Bedingung war nie wahr, der Stop wurde nie gesendet.

**Geändert:** Prüfung auf `'none'` umgestellt. Gemessen: Play sendet
MMC `06 02`, der rote Stop jetzt MMC `06 01`.

**Problem 2:** Die Tabulatur zeigt Einzelnoten — rechnerisch richtig, aber
ohne harmonischen Kontext schwer spielbar.

**Geändert**
- **Akkordzeile** über der Tabulatur: der Name steht am Taktanfang bei
  jedem Akkordwechsel (und immer am linken Rand des Fensters). Quelle ist
  `gBars` — dieselbe Wahrheit, aus der die Engine spielt.
- **Griffbilder:** Klick auf einen Akkordnamen öffnet ein Popup mit
  E-/A-Form-Barrégriff samt Bundangabe — als eigenes SVG, bewusst ohne
  externe Bibliothek (kein CDN, keine Abhängigkeit). Zwei bewegliche
  Standardformen statt aller Voicing-Varianten; exotische Typen (9, 13,
  7b9 …) werden auf den nächstliegenden Griff vereinfacht und mit ≈
  gekennzeichnet.
- Dock wächst dafür von 104 auf 116 px; alle sieben Bereiche passen
  weiterhin bei 1440 × 900 ohne Scrollen (knappster: MIDI & Transport
  716 von 720 px).

## BUILD 2026-08-01-M — Slave-Wartezustand sichtbar in der Transportleiste

**Problem:** Seit Build K wartet der Transport bei SLAVE AN ehrlich auf die
DAW-Clock — aber der Wartezustand stand nur im Protokoll. Wer das nicht
offen hat, sieht eine App, die „einfach nicht startet".

**Geändert:** Der Takt-Zähler zeigt im Wartezustand **⏳** und darunter
**„SLAVE: wartet auf DAW"**. Startet die DAW, übernimmt die normale
Anzeige; bei Stop wird zurückgesetzt.

## BUILD 2026-08-01-L — Build-Kennung zeigt wieder die Wahrheit

**Problem:** Die Seitenleiste zeigte dauerhaft „BUILD 2026-08-01-A", egal
welcher Build lief — man konnte nicht erkennen, welche Version geladen ist.

**Ursache:** `build.py` ersetzte einen Anker-Text, den es seit dem Umbau
des Markups nicht mehr gibt; `str.replace` schlägt still fehl.

**Geändert:** Die Ersetzung zielt jetzt auf das `buildTag`-Element und
läuft über `sub1()` — fällt der Anker künftig weg, bricht der Bau ab,
statt still die alte Kennung auszuliefern.

## BUILD 2026-08-01-K — Clock-Slave: Wartezustand schedult nicht mehr

**Problem:** Mit SLAVE AN, aber ohne laufende DAW-Clock spielte Play den
ersten Takt und die ersten Noten des zweiten — danach Stille. Bei 81 BPM
reproduzierbar exakt nach 1,35 Takten.

**Ursache:** Erbfehler aus Version 2. Der Transport meldete zwar „wartet
auf das Start-Signal der DAW", gewartet hat aber nur die Anzeige:
`schedTick` interpolierte die Zeitbasis ab Play munter weiter und
schedulte Noten — bis die 4000-ms-Resynchronisation die Zeitbasis
zurückriss (4000 ms bei 81 BPM = 1,35 Takte). Danach lief der Zeiger dem
bereits verbrauchten Ereignis-Index ewig hinterher.

**Geändert:** Im Slave-Modus ohne `ext.running` schedult `schedTick`
nichts — erst das Start-Signal der DAW (Start/Continue/SPP) öffnet den
Hahn. Der Playhead der Tabulatur bleibt im Wartezustand ausgeblendet.

**Getestet** headless mit simulierter Clock: Wartezustand 5 s → 0 Noten;
nach simuliertem DAW-Start mit Clock-Ticks läuft die Wiedergabe normal an.
Master-Betrieb unverändert.

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
