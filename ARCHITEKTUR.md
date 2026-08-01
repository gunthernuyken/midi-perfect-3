# Architektur

MIDI PERFECT 3 ist eine einzelne HTML-Datei — im Studio doppelklicken und
loslegen, kein Build, kein Server, keine Abhängigkeit. Anders als Version 2
wird die Datei jedoch aus Quellen **zusammengesetzt**: `werkstatt/build.py`
montiert die unveränderte Engine aus MIDI PERFECT 2 in die neue Hülle. Für
den Betrieb wird von der Werkstatt nichts gebraucht; die ausgelieferte Datei
steht für sich.

## Warum die Engine unangetastet bleibt

Die gesamte Klangerzeugung — Generatoren, Voicing-Aufbau, Swing- und
Humanize-Rechnung, Scheduler, Web-MIDI-Schicht, Clock/Slave, SMF-Export,
Setup-Speicher — ist 1:1 aus Version 2 übernommen (dort dokumentiert in
`midi-perfect/ARCHITEKTUR.md`, Abschnitte 0–11). Umbauen und Umbenennen
gleichzeitig ist die Art von Änderung, bei der man hinterher nicht mehr
weiß, welcher Teil den Fehler hat. Neu sind ausschließlich Markup,
Gestaltungssystem und eine dünne Hüllenschicht (Abschnitt 12).

## Schichten

| Schicht | Quelle | Aufgabe |
|---|---|---|
| Engine | aus `MIDI PERFECT 2.html` extrahiert | Noten erzeugen, senden, synchronisieren |
| Hülle (`shell.js`) | Werkstatt | Router der sieben Bereiche, Klappzustände, Reglerfüllung, Tonart-Kopplung, Dock mit Klaviatur + Tabulatur |
| Design (`mp3.css`, `compat.css`, `layout.css`) | Werkstatt | Tokens und Raster; `compat.css` legt die Klassennamen der Engine auf die neuen Tokens |
| Markup (`body.html`) | Werkstatt | die sieben Bereiche |

Die Hülle greift nie in die Erzeugung von Noten ein.

## Der Bau (`build.py`)

- schneidet aus der V2-Engine nur heraus, was die Hülle ersetzt (zweite
  Transportleiste, Klapp-Panel-Logik)
- wendet Korrekturen als **verankerte Ersetzungen** an: `sub1()` verlangt
  genau einen Treffer, sonst bricht der Bau ab — kein stilles Danebengreifen
- prüft zum Schluss, dass die Hülle **jede der 133 Element-IDs**
  bereitstellt, die die Engine anspricht; fehlt eine, schlägt der Bau fehl

## Scheduler und Timing

Der Sendepfad ist unverändert V2: alle Kanal-Nachrichten laufen durch eine
Schleuse (`sendAt()`), der Lookahead-Scheduler hält ~220 ms Musik in der
Queue, Ausgabe erfolgt mit Web-MIDI-Timestamps (sample-genau durch das OS).

Neu in Build B ist die **Tick-Quelle**: Chrome drosselt `setInterval` in
Hintergrund-Tabs auf ≥ 1 s — genau dann, wenn die DAW den Fokus hat. Der
20-ms-Tick kommt deshalb aus einem Web Worker (von der Drosselung
ausgenommen), mit `setInterval` als Rückfallebene. Im Hintergrund wächst der
Lookahead auf 600 ms; Stop und Tempoänderung sind Vordergrund-Aktionen und
behalten die kurze Queue. Anzeige-Arbeit (Klaviatur-Timer, Taktzähler)
pausiert bei verstecktem Tab.

## Tabulatur

Das Dock zeigt neben der Klaviatur eine Tabulatur: 8 Takte im Achtel-Raster,
Standard-Stimmung e B G D A E.

- **Datenfluss:** die Engine reicht am Visual-Timer Lane-Nummer und Tick
  durch (`MP3TAB.note(m, li, t)`), zeitgenau zum hörbaren Note-On — die
  einzige Durchreiche, die für das Dock ergänzt wurde
- **Saitenwahl** (`tabMap`): kleinster Bund gewinnt, belegte Zelle weicht
  auf die nächste freie Saite aus; Noten außerhalb des Griffbereichs werden
  oktaviert; Drums erscheinen als × auf der E-Zeile
- **Zwei Modi:** Fenster (8 Takte füllen, am Fensterrand leeren) oder
  Scroll (laufender Takt fest in der Mitte, Historie links)
- **Vorschau:** beide Modi zeichnen Kommendes gedimmt aus den bereits
  generierten Loop-Events (`sched.ev`); beim echten Note-On wird die Zahl
  fest. Gedimmt Stehendes wurde geplant, aber nicht gespielt (Lane aus)
- **Playhead:** eine rAF-Schleife liest die Scheduler-Position
  (`sched.tickRef`/`msRef`, dieselbe Interpolation wie `schedTick`, auch im
  Clock-Slave gültig) und führt eine Linie durch das Raster; der laufende
  Takt ist zusätzlich hinterlegt
- **Klaviatur-Filter:** `litKey` wird in der Hülle umhüllt statt die Engine
  anzufassen; Note-Off läuft ungefiltert, damit keine Taste hängen bleibt

## Speicher

Eigener Namensraum, Version 2 bleibt vollständig unberührt:

| Schlüssel | Inhalt |
|---|---|
| `midiperfect3.setups.v1` | benannte Setups |
| `midiperfect3.setup.auto` | Schnappschuss beim Schließen |
| `midiperfect3.lanes.v1` | Lane-Zustand |
| `midiperfect3.sync.v2` | Clock/Slave/MMC |
| `midiperfect3.ui.v1` | Bereich, Seitenleiste, Dock, Lane-Filter, Tab-Modus |
| `midiperfect3.lang` | DE / EN |

## Konventionen

Wie Version 2: ES5 durchgehend, Verben als Funktionspräfixe, Kommentare
erklären Entscheidungen, nicht Selbsterklärtes. Die Hülle läuft als IIFE
mit eigenem Namensraum und exportiert nur `MP3` und `MP3TAB`.
