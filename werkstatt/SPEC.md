# MIDI PERFECT 3 — Layout- und Systemspezifikation

Gegenstück zu `mp3.css`. Ziel: jeder der sieben Bereiche passt bei
**1440 × 900** ohne Scrollen. Eine HTML-Datei, kein Build, nur Chrome/Edge.

---

## 1 Höhen- und Breitenbudget

| Zone | Token | Höhe |
|---|---|---|
| Transportleiste | `--h-transport` | 52 px |
| Inhaltsbereich | `1fr` | **744 px** |
| Piano-Dock (offen) | `--h-piano` | 104 px |
| Piano-Dock (eingeklappt) | `--h-piano-min` | 30 px |

| Zone | Token | Breite |
|---|---|---|
| Seitenleiste (offen) | `--w-rail` | 200 px |
| Seitenleiste (Symbole) | `--w-rail-min` | 56 px |
| Inhaltsbereich | `1fr` | **1240 px** |

Netto nach Polsterung (`--pad-content` 14 px oben/unten, `--sp-5` 16 px seitlich):

**Inhaltsfläche = 1208 × 716 px.** Alle Rechnungen unten beziehen sich darauf.

Im Fenstermodus (Viewport ≈ 790 px) bleiben 606 px. Dann Piano einklappen
→ 680 px. Die Bereiche 1, 3, 5, 6, 7 passen auch dort; Bereiche 2 und 4 sind
die beiden, bei denen es eng wird (siehe § 5).

### Rechenbausteine

| Baustein | Höhe |
|---|---|
| Karte: Rand + Polster (8 oben / 12 unten) | 22 px |
| Karten-Titel inkl. Trennlinie | 22 px |
| Abstand Titel → Inhalt (`--sp-3`) | 8 px |
| **Karten-Grundhöhe** | **52 px** |
| Formularzeile (32 px Element + 6 px `row-gap`) | 38 px |
| Feld mit Etikett darüber (Lane-Raster) | 48 px |
| Chip- oder Knopfzeile | 38 px |
| Abstand zwischen Karten (`--sp-4`) | 12 px |

---

## 2 Klassennamen-Verzeichnis

### Rahmen und Zonen
| Klasse | Bedeutung |
|---|---|
| `.app` | Wurzelraster der Anwendung; vier Bereiche über `grid-template-areas`, volle Viewport-Höhe. |
| `.transport` | Durchgehende Kommandoleiste ganz oben, scrollt nie weg. |
| `.rail` | Feste linke Seitenleiste mit den sieben Bereichseinträgen. |
| `.content` | Einziger scrollbarer Bereich; enthält immer genau eine sichtbare `.view`. |
| `.piano-dock` | Klaviaturstreifen unten, in allen Bereichen sichtbar, einklappbar. |

### Transportleiste
| Klasse | Bedeutung |
|---|---|
| `.transport-sep` | Senkrechter Haarstrich als Gruppentrenner. |
| `.transport-spacer` | Dehnbare Lücke, schiebt Sprachumschalter und Hinweise nach rechts. |
| `.counter` | Block aus Takt-Zähler und Unterzeile (Loop-Stand). |
| `.counter-bar` / `.counter-sub` | Grosse Taktzahl in Cyan / kleine Beschriftung darunter. |
| `.beats` / `.beat` | Container der vier Beat-Punkte / ein Punkt; `.is-on` = aktueller Schlag. |
| `.transport-lanes` / `.lane-key` | Leiste der fünf Lane-Kürzel / ein Kürzel, `aria-pressed` trägt Ein/Aus. |
| `.lang-toggle` | Umschalter DE/EN. |

### Seitenleiste
| Klasse | Bedeutung |
|---|---|
| `.rail-brand` | Kopfzeile mit Produktname und Build-Kennung. |
| `.rail-item` | Ein Bereichseintrag: Symbol, Beschriftung, Tastaturkürzel; `aria-current="page"` = aktiv. |
| `.rail-item .ico` / `.label` / `.tip` | Unicode-Symbol / Textbeschriftung / angeheftete Sprechblase im eingeklappten Zustand. |
| `.rail-item[data-flag]` | Statuspunkt am Eintrag (`ok`, `warn`, `err`, ohne Wert = violett/aktiv). |
| `.rail-spacer` | Schiebt den Einklappknopf ans untere Ende. |
| `.rail-toggle` | Klappt die Leiste auf 56 px Symbolbreite; `aria-expanded` trägt den Zustand. |

### Inhalt, Karten, Formular
| Klasse | Bedeutung |
|---|---|
| `.view` | Ein Bereich; genau einer ohne `[hidden]`. Eigenes Rasterlayout pro Bereich. |
| `.view--midi` … `.view--monitor` | Die sieben Bereichslayouts mit ihren Spaltenzahlen. |
| `.col` | Senkrechte Kartenspalte innerhalb einer `.view`. |
| `.col--fill` | Wie `.col`, letzte Karte füllt die Resthöhe (Log, Monitor). |
| `.card` | Gruppierungsbehälter; eigener Container für Container-Abfragen. |
| `.card--full` / `--span2` / `--span3` | Karte spannt über alle / zwei / drei Rasterspalten. |
| `.card--flush` | Karte ohne Innenpolster (für randlose Inhalte). |
| `.card-title` | Abschnittsüberschrift der Karte, Cyan, gesperrt, Grossbuchstaben. |
| `.card-title .hint` | Rechtsbündige Erläuterung in der Titelzeile. |
| `details.card` | Einklappbare Karte; `<summary>` trägt den `.card-title`. |
| `.section-head` | Untergliederung innerhalb einer Karte, mit auslaufender Linie. |
| `.form` | Dichtes Raster aus Etikett-/Element-Paaren, Etikett links daneben. |
| `.form--2` `--3` `--4` | Zwei, drei oder vier Paare nebeneinander. |
| `.lbl` | Feld-Etikett; gehört per `for`/`id` zum Bedienelement. |
| `.span-all` / `.row-all` | Element über alle Elementspalten / ganze Zeile inkl. Etikettenspalte. |
| `.field` | Stapelvariante Etikett **über** Element, für sehr breite Felder. |
| `.row` / `.row--tight` / `.row--end` | Waagerechte Reihe gleichrangiger Elemente ohne Etiketten. |
| `.hint` | Erläuterungstext; `--warn`, `--ok`, `--err` als semantische Varianten. |
| `.error-note` | Fehlermeldung unter einem Formular, erscheint erst nach Interaktion. |

### Bedienelemente
| Klasse | Bedeutung |
|---|---|
| `.btn` | Basis aller Knöpfe, Mindesthöhe 32 px. |
| `.btn--primary` | Hauptaktion, Cyanfläche mit dunkler Schrift (Play, Apply, Bauen). |
| `.btn--secondary` | Umrissknopf für Nebenaktionen. |
| `.btn--danger` | Zerstörende oder anhaltende Aktion (Stop, Leeren, Zurücksetzen). |
| `.btn--violet` | Zufall und Reharmonisierung (Reroll, Generator, Mutation). |
| `.btn--ok` | Export und Speichern. |
| `.btn--ghost` | Fast unsichtbarer Knopf für Randfunktionen. |
| `.btn--lg` / `.btn--icon` | 38 px hoch (Transport) / quadratisch, nur Unicode-Zeichen. |
| `.chip` | Zweizustandsschalter, `aria-pressed` trägt den Zustand. |
| `.chip--lock` / `--inf` / `--lane` | Gelb (Sperre), Violett (Infinity), Lane-Farbe. |
| `.segment` | Segment-Umschalter, `role="radiogroup"` mit `role="radio"`-Knöpfen. |
| `.slider` | Raster aus `input[type=range]` und Wertanzeige. |
| `.slider-val` | Wertanzeige rechts, feste Zeichenbreite, Monospace. |
| `.num-sm` / `.num-md` | Schmales / mittleres Zahlenfeld. |
| `.input-mono` | Monospace-Eingabe für die Akkordzeile. |
| `.status` / `.dot` | Statuszeile mit Punkt; `.dot--ok/--warn/--err`. |

### Lanes
| Klasse | Bedeutung |
|---|---|
| `.lane-card` | Eine Lane-Zeile; `data-lane` setzt die Identitätsfarbe `--lane`. |
| `.lane-head` | Kopfzeile mit Name und Schaltern. |
| `.lane-name` | Lane-Bezeichnung in Identitätsfarbe. |
| `.lane-ch` | Kanalangabe, rechtsbündig, Monospace. |
| `.lane-power` | Ein/Aus-Chip; steuert per `:has()` den reduzierten Zustand der Karte. |
| `.lane-solo` | Solo-Chip; dimmt per `:has()` alle anderen Lanes. |
| `.lane-controls` | 12-Spalten-Raster der Lane-Bedienelemente. |
| `.span-2` `.span-3` `.span-4` | Feld spannt zwei, drei oder vier der zwölf Spuren. |

### Song
| Klasse | Bedeutung |
|---|---|
| `.bars` / `.bar-cell` | Raster der Takt-Kacheln / eine Kachel; `aria-current` = aktiver Takt, `data-locked` = gesperrt. |
| `.bar-cell .n` / `.name` / `.fn` | Taktnummer / Akkordname / Stufenfunktion. |
| `.suggest` / `.sug` | Vorschlagsleiste / eine Vorschlagskachel; `data-chromatic` = leiterfremd. |
| `.circle-of-fifths` | SVG-Quintenzirkel, quadratisch, `.node` sind die klickbaren Tonarten. |
| `.key-chip` | Kleine Marke für leitereigene Akkorde; `data-tonic` hebt die Tonika hervor. |

### Monitor
| Klasse | Bedeutung |
|---|---|
| `.log` | Protokollfläche, Monospace, eigener Rollbereich. |
| `.log .i/.ok/.w/.e/.m/.p` | Semantikklassen; jede setzt **zusätzlich** ein Unicode-Vorzeichen. |
| `.monitor` | Zusatzklasse zu `.log` für den MIDI-Monitor (kleinere Schrift, `.blk`/`.snd`). |
| `.channels` / `.ch-cell` | 16-Spalten-Kanalbelegung / eine Zelle; `data-lane` färbt, `data-active` blitzt. |
| `.routing` | Einzeilige Routing-Zusammenfassung in Monospace. |

### Piano
| Klasse | Bedeutung |
|---|---|
| `.piano-bar` | Kopfleiste des Docks mit Beschriftung und Einklappknopf. |
| `.piano-toggle` | Einklappknopf; `aria-expanded` steuert die Dock-Höhe. |
| `.piano` | Positionierungsfläche der Tasten. |
| `.key-w` / `.key-b` | Weisse / schwarze Taste; `data-lane` färbt eine klingende Note. |

### Hilfsklassen
`.mono` `.dim` `.grow` `.nowrap` `.stack` `.stack--tight` `.fill` `.sr-only`

---

## 3 Beispiel-Markup

### App-Rahmen

```html
<div class="app" data-playing="false">

  <header class="transport">
    <button class="btn btn--primary btn--lg" id="tbPlay">&#9654; Play</button>
    <button class="btn btn--danger  btn--lg" id="tbStop" disabled>&#9632; Stop</button>
    <button class="btn btn--violet  btn--lg btn--icon" id="tbRoll"
            title="Alle nicht gesperrten Lanes neu würfeln (R)">&#10022;</button>

    <span class="transport-sep"></span>

    <div class="counter">
      <span class="counter-bar" id="tbBar">--</span>
      <span class="counter-sub" id="tbLoop">Loop &infin;</span>
    </div>
    <div class="beats" role="img" aria-label="Schlag im Takt">
      <span class="beat is-on"></span><span class="beat"></span>
      <span class="beat"></span><span class="beat"></span>
    </div>

    <span class="transport-sep"></span>

    <div class="transport-lanes">
      <button class="lane-key" style="--lane:var(--lane-drums)"  aria-pressed="true">Dr <kbd>1</kbd></button>
      <button class="lane-key" style="--lane:var(--lane-bass)"   aria-pressed="true">Ba <kbd>2</kbd></button>
      <button class="lane-key" style="--lane:var(--lane-chords)" aria-pressed="true">Ch <kbd>3</kbd></button>
      <button class="lane-key" style="--lane:var(--lane-arp)"    aria-pressed="false">Ar <kbd>4</kbd></button>
      <button class="lane-key" style="--lane:var(--lane-melody)" aria-pressed="false">Me <kbd>5</kbd></button>
    </div>

    <span class="transport-spacer"></span>
    <span class="hint nowrap"><kbd>Leer</kbd> Play &nbsp;<kbd>R</kbd> Reroll</span>
    <button class="lang-toggle" id="langTgl"><b>DE</b>&nbsp;·&nbsp;EN</button>
  </header>

  <nav class="rail" aria-label="Bereiche">
    <div class="rail-brand"><span>MIDI PERFECT&nbsp;3<small>Build 2026-08-01</small></span></div>
    <!-- sieben .rail-item, siehe unten -->
    <span class="rail-spacer"></span>
    <button class="rail-toggle" aria-expanded="true">&#9666; <span class="label">Leiste</span></button>
  </nav>

  <main class="content">
    <section class="view view--midi" id="viewMidi">…</section>
    <section class="view view--song" id="viewSong" hidden>…</section>
    <!-- … -->
  </main>

  <footer class="piano-dock">
    <div class="piano-bar">
      <span>Klaviatur</span>
      <span class="hint" id="pianoNotes">—</span>
      <button class="piano-toggle" aria-expanded="true">Einklappen</button>
    </div>
    <div class="piano" id="piano"></div>
  </footer>

</div>
```

### Seitenleisten-Eintrag

```html
<button class="rail-item" aria-current="page" data-view="midi">
  <span class="ico" aria-hidden="true">&#9889;</span>
  <span class="label">MIDI &amp; Transport</span>
  <kbd>1</kbd>
  <span class="tip">MIDI &amp; Transport</span>
</button>

<button class="rail-item" data-view="sync" data-flag="warn">
  <span class="ico" aria-hidden="true">&#128257;</span>
  <span class="label">Sync</span>
  <kbd>5</kbd>
  <span class="tip">Sync</span>
</button>
```

### Karte

```html
<article class="card">
  <h2 class="card-title">
    <span>Kanal-Routing</span>
    <span class="hint">Eine Cubase-Spur pro Kanal</span>
  </h2>

  <div class="form form--2">…</div>

  <p class="routing" id="chMap">Routing: <b>Ch 10</b> Drums · <b>Ch 2</b> Bass</p>
</article>
```

Einklappbare Variante:

```html
<details class="card" open>
  <summary><h2 class="card-title"><span>Hinweise zu Cubase</span></h2></summary>
  <p class="hint">…</p>
</details>
```

### Formular-Paar

```html
<div class="form form--2">
  <label class="lbl" for="midiOut">MIDI-Ausgang</label>
  <select id="midiOut"><option>IAC-Treiber Bus 1</option></select>

  <label class="lbl" for="allCh">Alle Lanes auf</label>
  <select id="allCh"><option>Kanal 1</option></select>

  <label class="lbl" for="mmcDev">MMC-Gerät</label>
  <input type="number" id="mmcDev" class="num-sm" min="0" max="127" value="127">

  <label class="lbl" for="countIn">Count-In</label>
  <select id="countIn"><option>ohne</option><option>2 Takte</option></select>

  <!-- Element über beide Paar-Spalten, Etikett bleibt links -->
  <label class="lbl" for="chordInput">Akkordfolge</label>
  <input type="text" id="chordInput" class="input-mono span-all"
         value="A7 D7 A7 A7 D7 D7 A7 A7 E7 D7 A7 E7">
</div>
```

### Schalter-Chip

```html
<button class="chip" id="chGuard" aria-pressed="false">
  <span aria-hidden="true">&#9675;</span> Kanalsperre
</button>

<button class="chip chip--lock" id="barLock" aria-pressed="true">
  <span aria-hidden="true">&#128274;</span> Takt gesperrt
</button>

<button class="chip chip--inf" id="infTgl" aria-pressed="true">
  <span aria-hidden="true">&#9679;</span> Infinity
</button>
```

`aria-pressed` ist die einzige Zustandsquelle — CSS liest sie, JS setzt sie.
Das Unicode-Zeichen wird mitgetauscht, damit der Zustand nicht allein an der
Farbe hängt.

### Lane-Karte

```html
<article class="lane-card" data-lane="chords">

  <div class="lane-head">
    <button class="chip chip--lane lane-power" aria-pressed="true">
      <span aria-hidden="true">&#9679;</span> An</button>
    <button class="chip chip--sm lane-solo" aria-pressed="false">Solo</button>
    <span class="lane-name">CHORDS</span>
    <button class="chip chip--sm chip--lock" aria-pressed="false">
      <span aria-hidden="true">&#128275;</span> frei</button>
    <button class="chip chip--sm">&#10022; Reroll</button>
    <button class="chip chip--sm">&#127918; Style</button>
    <button class="chip chip--sm">&#128266; Test</button>
    <span class="lane-ch">Ch 3</span>
  </div>

  <div class="lane-controls">
    <div class="field span-3">
      <label class="lbl" for="chords-style">Style</label>
      <select id="chords-style"><optgroup label="Blues"><option>Comping</option></optgroup></select>
    </div>
    <div class="field">
      <label class="lbl" for="chords-ch">Kanal</label>
      <select id="chords-ch"><option>3</option></select>
    </div>
    <div class="field span-2">
      <label class="lbl" for="chords-prog">Sound</label>
      <select id="chords-prog"><option>5 · Electric Piano 1</option></select>
    </div>
    <div class="field">
      <label class="lbl" for="chords-oct">Oktave</label>
      <select id="chords-oct"><option>C3</option></select>
    </div>
    <div class="field">
      <label class="lbl" for="chords-vel">Velocity</label>
      <div class="slider">
        <input type="range" id="chords-vel" min="30" max="127" value="92" style="--fill:64%">
        <output class="slider-val" for="chords-vel">92</output>
      </div>
    </div>
    <div class="field">
      <label class="lbl" for="chords-dens">Dichte</label>
      <div class="slider">
        <input type="range" id="chords-dens" min="10" max="100" value="70" style="--fill:67%">
        <output class="slider-val" for="chords-dens">70</output>
      </div>
    </div>
    <div class="field">
      <label class="lbl" for="chords-swing">Swing</label>
      <select id="chords-swing"><option>global (58 %)</option></select>
    </div>
    <div class="field">
      <label class="lbl" for="chords-vsp">Vel-Streuung</label>
      <div class="slider">
        <input type="range" id="chords-vsp" min="0" max="24" value="8" style="--fill:33%">
        <output class="slider-val" for="chords-vsp">8</output>
      </div>
    </div>
  </div>

</article>
```

### Regler mit Wertanzeige (allgemein)

```html
<label class="lbl" for="bpm">Tempo</label>
<div class="slider">
  <input type="range" id="bpm" min="40" max="240" value="118" style="--fill:39%">
  <output class="slider-val" for="bpm">118<small> bpm</small></output>
</div>
```

```js
// --fill treibt den gefüllten Bahnanteil. Einmal beim Aufbau und bei jedem input.
const setFill = el => el.style.setProperty(
  '--fill', ((el.value - el.min) / (el.max - el.min) * 100) + '%');
document.addEventListener('input', e => {
  if (e.target.matches('input[type=range]')) setFill(e.target);
});
```

---

## 4 Gruppierung der sieben Bereiche

Alle Rechnungen für 1208 × 716 px netto. „Spalten“ = Rasterspalten der `.view`.

### 1 · MIDI & Transport — 2 Spalten (`7fr 5fr` → 698 / 498 px)

| Spalte | Karten | Formular | Höhe |
|---|---|---|---|
| links | **Verbindung** — Ausgang, Status, Kanalsperre, Monitor-Schalter | `.form--2`, 2 Zeilen | 128 |
| links | **Kanal-Routing** — Ziel-Kanal, „auf einen Kanal“, „verteilen“, GM setzen/aus, Reset + `.channels` | `.form--2`, 3 Zeilen + Kanalstreifen | 240 |
| links | **Log** | `.col--fill`, füllt Rest | 324 |
| rechts | **Tempo & Makros** — Tempo, Swing, Humanize, Energy, Complexity, Loop | `.form--2`, 3 Zeilen | 166 |
| rechts | **Infinity** — Schalter, Mutation %, Hinweis | `.form--2`, 1 Zeile + Chip | 128 |
| rechts | **Kurzbefehle & Hinweise** | füllt Rest | 398 |

Summe links 128 + 240 + 324 + 2·12 = **716** ✓

> Die fünf Prozentregler stehen bewusst **paarweise** (`--2`), nicht in einer
> Sechserreihe: bei 498 px Spaltenbreite bekäme jeder Regler sonst 60 px Bahn,
> was für 0–100 % zu grob greift. Zwei Paare geben ≈ 150 px Bahn.

### 2 · Song — 3 Spalten (`300px 1fr 1fr` → 300 / 442 / 442 px)

| Zeile | Inhalt | Spalten | Höhe |
|---|---|---|---|
| 1 | **Akkordfolge** — Textfeld (`.span-all`), Preset, Bars/Chord, Default-Typ, Apply, Leeren | `.card--full`, `.form--3`, 2 Zeilen | 128 |
| 2 | **Takte** — `.bars`, `auto-fill minmax(74px,1fr)` = 15 Kacheln je Zeile | `.card--full` | 202 (32 Takte, 3 Zeilen) |
| 3a | **Quintenzirkel** — SVG max 260 px + Tonart + Modus + „erkennen“ | Spalte 1 | 348 |
| 3b | **Stufen** (`.suggest`) + **Nächster Akkord** (`.suggest`) | Spalte 2, zwei Karten | 188 |
| 3c | **Reharmonisierung** (8 Knöpfe, 2 Zeilen) + **Generator** (Genre, Länge, Knopf) | Spalte 3, zwei Karten | 218 |

Summe 128 + 202 + 348 + 2·12 = **702** ✓ (14 px Reserve)

> Kritisch: 32-Takt-Progressionen. Ab 33 Takten läuft `.bars` in eine vierte
> Zeile (+58 px) und der Bereich überschreitet 716. Gegenmassnahme im Markup:
> die Takt-Karte bekommt `max-block-size: 214px; overflow: auto` — dann rollt
> nur der Kachelblock, nicht die Seite.

### 3 · Blues-Werkstatt — 3 Spalten (`1fr 1fr 1fr` → je 394 px)

| Zeile | Karten | Formular | Höhe |
|---|---|---|---|
| 1 | **Form** (Tonart, Form, Turnaround, Quick-Change, „Bauen“) · **Transposition** (±½ Ton, Zieltonart, transponieren, Übungs-Zirkel) · **Groove** (Kopplung, Backbeat, Turnaround-Fill) | je `.form--1` | 242 |
| 2 | **Tempofelder** (`.card--span2`, Chip-Raster, 2 Zeilen) · **Chorus-Bogen** (Chorus-Dynamik, Bogen, Bogen über, Ride ab, Expression-CC, Velocity-Hub) | `.form--1`, 6 Zeilen | 280 |
| 3 | **Hinweise Swing & Chorus** (`.card--full`) | — | Rest 158 |

Summe 242 + 280 + 158 + 2·12 = **704** ✓

### 4 · Lanes — 1 Spalte, Lane-Raster mit **12 Spuren**

| Block | Höhe |
|---|---|
| **Band-Presets** — Preset, Laden, Styles würfeln, Tempo übernehmen, On/Off übernehmen (`.row`) | 82 |
| 5 × `.lane-card` (Kopf 32 + Steuerzeile 48 + Polster 20 + Rand 2 = 102) | 510 |
| 4 × Abstand `--sp-3` | 24 |

Summe 82 + 12 + 510 + 24 = **628**, Reserve **88 px**.

Spurenverteilung im `.lane-controls` (Summe = 12):

| Feld | Spuren | Breite bei 1184 px |
|---|---|---|
| Style | 3 | 290 |
| Kanal | 1 | 93 |
| Sound / Drum-Kit | 2 | 191 |
| Oktave / Fill alle | 1 | 93 |
| Velocity | 1 | 93 |
| Dichte | 1 | 93 |
| Swing | 1 | 93 |
| Vel-Streuung | 1 | 93 |
| *(ARP zusätzlich)* Rate | 1 | 93 |
| *(ARP)* Oktaven + Gate | 2 → zweite Zeile | |

> Kritisch: die ARP-Lane hat elf statt neun Felder. Rate passt noch in die
> erste Zeile (11 von 12 Spuren belegt), Oktaven und Gate rutschen in eine
> zweite Zeile (+54 px). Das verbraucht 54 der 88 px Reserve — der Bereich
> bleibt bei **682 px** und passt. Bei eingeklappter Seitenleiste (1424 px
> Inhalt) passt auch die zwölfte Spur in Zeile 1.

### 5 · Sync — 3 Spalten

| Zeile | Karten | Höhe |
|---|---|---|
| 1 | **Clock & Slave** (Clock-Schalter, Slave-Schalter, Clock-Eingang, Sync-Ausgang) · **Cubase & MMC** (Transportbefehl, Aktion bei Play, MMC-Gerät, Count-In, bei Stop) · **Sofortbefehle** (Play, Record, Stop, Clock-Burst als Knopfstapel) | 242 |
| 2 | **Anleitung** (`.card--full`, eigener Rollbereich) | Rest 462 |

Summe **716** ✓ — der lange Erklärtext bekommt `overflow:auto` in der Karte,
damit er die Seite nie verlängert.

### 6 · Export & Setups — 2 Spalten (je 598 px)

| Spalte | Karte | Formular | Höhe |
|---|---|---|---|
| links | **SMF-Export** — Wiederholungen, Variation, Humanize, Dateiname + Knopf | `.form--1`, 4 Zeilen | 204 |
| links | **Diese Seite speichern** | `.row` | 90 |
| rechts | **Setups** — Liste gespeicherter Setups, Speichern/Laden/Löschen/Umbenennen | `.col--fill` | 716 |

Der luftigste Bereich. Hier ist Platz für eine Setup-Liste mit Vorschau
(Tonart, Tempo, Band-Preset je Eintrag).

### 7 · Monitor — 2 Spalten, `grid-template-rows: auto minmax(0,1fr)`

| Zeile | Inhalt | Höhe |
|---|---|---|
| 1 | **Kanal-Belegung** (`.card--full`, `.channels` mit 16 Zellen) | 90 |
| 2a | **Log** (`.log`) | 614 |
| 2b | **MIDI-Monitor** (`.log .monitor`) | 614 |

Summe **716** ✓ — beide Protokollflächen haben `min-block-size: 0` und
`overflow: auto`, deshalb kann dieser Bereich die Seite grundsätzlich nicht
verlängern, egal wie viele Zeilen anfallen.

---

## 5 Kontrastprüfung (WCAG 2.1 AA)

Gerechnet nach WCAG-Relativluminanz. **Fett** = Korrektur gegenüber
MIDI PERFECT 2.

### 5.1 Text auf Flächen — Soll 4.5 : 1

| Verwendung | Vorder- / Hintergrund | Verhältnis | AA |
|---|---|---|---|
| Fliesstext auf Karte | `#e6e9f2` / `#131326` | **15.06** | ✓ |
| Fliesstext im Eingabefeld | `#e6e9f2` / `#0f3460` | 10.30 | ✓ |
| Zweitrangiger Text auf Karte | `#b6c0d8` / `#131326` | 10.03 | ✓ |
| Zweitrangiger Text im Log | `#b6c0d8` / `#070b16` | 10.78 | ✓ |
| Feld-Etikett auf Karte | `#9aa3c0` / `#131326` | 7.29 | ✓ |
| Feld-Etikett auf Lane-Karte | `#9aa3c0` / `#0f1a30` | 6.92 | ✓ |
| Kleintext auf Eingabefeld | `#9aa3c0` / `#0f3460` | 4.98 | ✓ |
| Seitenleisten-Beschriftung | `#9aa3c0` / `#0d0d1a` | 7.69 | ✓ |
| Cyan-Akzenttext auf Karte | `#00d4ff` / `#131326` | 10.32 | ✓ |
| Cyan in der Transportleiste | `#00d4ff` / `#0d0d1a` | 10.89 | ✓ |
| Aktiver Seitenleisten-Eintrag | `#00d4ff` / Aktivfüllung `#101b2c` | 9.76 | ✓ |
| Chip „an“, Cyantext | `#00d4ff` / `#0c2b46` | 8.18 | ✓ |
| Chip „gesperrt“, Gelb | `#ffcc00` / `#22261f` | 10.17 | ✓ |
| `<kbd>`-Kürzel | `#9aa3c0` / `#152442` | 6.14 | ✓ |

### 5.2 Bestandswerte, die durchfallen — mit Korrektur

| Bestand (MP2) | Verwendung | Alt | Neu | Neu |
|---|---|---|---|---|
| `#5a5a72` auf `#0a0a16` | Log-Grundtext | **2.94 ✗** | `--c-text-dim #b6c0d8` auf `#070b16` | **10.78 ✓** |
| `#5a5a72` auf `#0f3460` | Taktnummer, Vorschlags-Zusatz | **1.87 ✗** | `--c-text-mute #9aa3c0` | **4.98 ✓** |
| `#6b7796` auf `#0d1830` | Kanal-Monitor-Zellen | **3.95 ✗** | `--c-text-mute #9aa3c0` auf `#0f1a30` | **6.92 ✓** |
| `#7b86a6` auf `#16213e` | Hilfetext `.mini` | **4.39 ✗** | `--c-text-mute #9aa3c0` auf `#131326` | **7.29 ✓** |
| `#8e8ea6` auf `#16213e` | Feld-Etiketten | 4.97 (knapp) | `#9aa3c0` auf `#131326` | **7.29 ✓** |
| `#1a4a8a` Rahmen auf Panel | Grenze aller Bedienelemente | **2.08 ✗** | `--c-border-ctl #4a7fc4` | **4.46 ✓** |
| Weiss auf `#ff4455` | Stop-/Gefahrknopf | **3.38 ✗** | Weiss auf `--c-err-solid #c81e33` | **5.69 ✓** |
| Weiss auf `#a855f7` | Reroll-/Mutationsknopf | **3.96 ✗** | Weiss auf `--c-violet-solid #7c3aed` | **5.70 ✓** |
| Weiss auf Verlauf `#00d4ff→#0077aa` | Play-Knopf | **1.77 ✗** am hellen Ende | `--c-text-on-accent #04121b` auf Cyan | **10.71 ✓** |
| Weiss auf `#0c8a55` | Export-Knopf | **4.39 ✗** | Weiss auf `--c-ok-solid #16794f` | **5.41 ✓** |
| `#a855f7` als Schrift auf Panel | Stufenbezeichnung, Mutation | 4.62 (knapp) | `--c-violet-text #c9a6ff` | **9.04 ✓** |
| Lane „aus“ bei `opacity:.42` | ausgeschaltete Lane | **≈ 2.5 ✗** | `opacity:.8` + `saturate(.3)` + eigene Fläche | **5.09 ✓** |

### 5.3 Grenzen von Bedienelementen — Soll 3 : 1 (WCAG 1.4.11)

| Grenze | Vorder- / Hintergrund | Verhältnis | AA |
|---|---|---|---|
| Bedienelement gegen Karte | `#4a7fc4` / `#131326` | 4.46 | ✓ |
| Bedienelement gegen eigene Füllung | `#4a7fc4` / `#0f3460` | 3.05 | ✓ |
| Bedienelement gegen Lane-Karte | `#4a7fc4` / `#0f1a30` | 4.23 | ✓ |
| Bedienelement gegen Leiste | `#4a7fc4` / `#0d0d1a` | 4.70 | ✓ |
| Bedienelement gegen Inhaltsfläche | `#4a7fc4` / `#0a0e14` | 4.72 | ✓ |
| Hover-Grenze | `#6f9fdb` / `#131326` | 6.67 | ✓ |
| Beat-Punkt „aus“ (Ring) | `#4a7fc4` / `#0d0d1a` | 4.70 | ✓ |
| Beat-Punkt „an“ | `#00d4ff` / `#0d0d1a` | 10.89 | ✓ |
| Reglerbahn (Rand) | `#4a7fc4` / `#131326` | 4.46 | ✓ |
| Reglergriff | `#00d4ff` / `#131326` | 10.32 | ✓ |
| Fehlerrahmen am Eingabefeld | `#ff5c6a` / `#0f3460` | 4.16 | ✓ (Grenze) |

> `#0f3460` als Kartenkante erreicht gegen `#0a0e14` nur 1.55 : 1. Das ist
> zulässig, weil die Kartenkante **rein dekorativ** ist und kein Bedienelement
> begrenzt — die Karte wird über ihre hellere Fläche erkannt. Grenzen mit
> Bedeutung nutzen ausnahmslos `--c-border-ctl`.

### 5.4 Lane-Identitätsfarben (unverändert, alle bestehen)

| Lane | Farbe | auf Lane-Karte `#0f1a30` | auf Leiste `#0d0d1a` |
|---|---|---|---|
| DRUMS | `#ff44aa` | 5.50 ✓ | 6.11 ✓ |
| BASS | `#ff6622` | 5.93 ✓ | 6.59 ✓ |
| CHORDS | `#4488ff` | 5.13 ✓ | 5.70 ✓ |
| ARP | `#22cc88` | 8.31 ✓ | 9.23 ✓ |
| MELODY | `#ffcc00` | 11.47 ✓ | 12.75 ✓ |

Keine Lane-Farbe muss angetastet werden. Sie wird jedoch **nie allein** als
Bedeutungsträger eingesetzt: in der Transportleiste steht das Lane-Kürzel als
Text daneben, in der Kanalbelegung die Kanalnummer, auf der Klaviatur die
gleichzeitige Lane-Zeile im Log.

### 5.5 Fokus

| Situation | Ring / Untergrund | Verhältnis |
|---|---|---|
| Fokusring auf Karte | `#8ee9ff` / `#131326` | 13.27 ✓ |
| Fokusring auf Leiste | `#8ee9ff` / `#0d0d1a` | 14.00 ✓ |
| Fokusring auf Cyanknopf | `#8ee9ff` / `#00d4ff` | 1.29 ✗ … |
| … dafür der innere Trennring | `#04121b` / `#00d4ff` | 10.71 ✓ |

Der Ring besteht aus zwei Lagen: `box-shadow` 2 px in `--c-focus-halo`
(dunkel) plus `outline` 2 px in `--c-focus` (hell). Auf jeder Fläche trägt
mindestens eine der beiden Lagen über 3 : 1. Fokus wird nie ausschliesslich
über Farbe angezeigt.

### 5.6 Bekannte, bewusst getroffene Ausnahmen

- **Klickzielgrösse 32 px statt 44 px** (WCAG 2.5.5). Reine Maus- und
  Tastaturanwendung auf dem Desktop, ein einzelner erfahrener Nutzer, kein
  Touch. 44 px würden Bereich 4 (Lanes) über die 716-px-Grenze drücken.
  Abgeschwächt durch: Abstand ≥ 6 px zwischen allen Zielen und Tastaturkürzel
  für alle häufigen Aktionen.
- **`--fs-micro` (10 px)** ausschliesslich für Zahlen und `<kbd>`, nie für
  Fliesstext. Kontrast dieser Elemente liegt über 6 : 1.
- **Deaktivierte Elemente** (`opacity:.45`, ≈ 4.25 : 1) sind nach WCAG 1.4.3
  von der Kontrastanforderung ausgenommen.

---

## 6 Eingesetzte moderne CSS-Features

| Feature | Einsatzort | Warum |
|---|---|---|
| `:has()` | Seitenleiste eingeklappt, Piano eingeklappt, Lane aus, Solo | Zustand lebt am Schalter (`aria-*`), keine Spiegelklasse am Vorfahren nötig. |
| Container-Grössenabfragen | `.rail` (Symbolmodus), `.card` (Formularspalten), `.lane-card` | Der Bereich reagiert auf seine tatsächliche Breite, nicht auf die Viewportbreite — bei ein- und ausklappbarer Seitenleiste der einzig korrekte Bezug. |
| `color-mix()` | Chip-Füllungen, Lane-Tönungen, Hover | Eine Lane-Farbe, alle Zustandstöne daraus abgeleitet. |
| Anchor Positioning + `anchor-scope` | Sprechblase am eingeklappten Seitenleisten-Eintrag | Kein JS für Positionierung, kein `title`-Attribut mit Verzögerung. |
| `@property` | `--lane`, `--fill` | Typisierte Eigenschaften sind animierbar bzw. in Verläufen interpolierbar. |
| `interpolate-size: allow-keywords` | Piano-Dock, einklappbare Karten | Übergang auf natürliche Höhe ohne feste Pixelwerte. |
| Scroll-gesteuerte Animation | genau eine: Scroll-Schatten im Inhalt | Zeigt an, dass oben Inhalt liegt — ohne Scroll-Ereignis in JS. |
| `scrollbar-gutter: stable` | `.content`, `.log` | Kein Sprung, wenn ein Log die Rollleiste einblendet. |
| `overscroll-behavior: contain` | `.content`, `.log` | Scrollen im Log zieht nie die Seite mit. |
| `:user-invalid` | Zahlenfelder | Fehler erst nach Interaktion, nicht beim Laden. |
| `text-box: trim-both` | Etiketten, Titel, Chips | Spart rund 2 px je Zeile — bei 14 Formularzeilen eine halbe Karte. |
| `prefers-reduced-motion` / `prefers-contrast` | global | Bewegung aus, Rahmen verstärkt. |

### Was JavaScript beisteuern muss

1. `--fill` auf jedem `input[type=range]` setzen (Aufbau + `input`-Ereignis).
2. `aria-pressed` auf allen `.chip` und `.lane-key` pflegen — CSS liest nur.
3. `aria-current="page"` auf dem aktiven `.rail-item`, `[hidden]` auf allen
   nicht sichtbaren `.view`.
4. `aria-expanded` auf `.rail-toggle` und `.piano-toggle`.
5. `data-playing` auf `.app` beim Start/Stopp.
6. `data-lane` auf `.key-w` / `.key-b` bei Note-on, entfernen bei Note-off.
