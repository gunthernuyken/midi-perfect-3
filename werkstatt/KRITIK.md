# MIDI PERFECT 3 — Gestaltungskritik

Grundlage: die sieben Screenshots bei 1440×900, dazu Messungen im gebauten
Dokument (Playwright/Chromium, gleiche Auflösung). Jede Zahl in diesem Text ist
gemessen, nicht geschätzt. Die Höhenrechnung selbst wird nicht angezweifelt —
kein Bereich scrollt, das stimmt.

Die Ladereihenfolge ist `mp3.css` → `compat.css` → `layout.css`. Bei gleicher
Spezifität gewinnt also `layout.css`. Korrekturen sind entsprechend zugeordnet.

---

## MUSS

### 1. 41 Schalter sind `<span>` und damit für die Tastatur nicht vorhanden

**Wo** — Alle `.chip`-Elemente in allen Bereichen: Kanalsperre und MIDI-Monitor
(Bereich 1), Septakkorde (2), Quick-Change, Groove-Kopplung, Turnaround-Fill,
Chorus-Dynamik, Arrangement-Bogen (3), Tempo/Swing übernehmen, Lane On/Off
übernehmen sowie pro Lane die drei Schalter OFF/SOLO/frei (4), Autoload (6).
Gemessen: 41 Stück, alle `SPAN`, alle ohne `tabindex`, alle ohne `role`.

**Warum es stört** — Die Anwendung ist für Maus *und Tastatur* gebaut, der
Nutzer spielt dabei. Mit der Tabulatortaste sind diese Schalter nicht
erreichbar; SOLO und die Takt-Sperre lassen sich ohne Maus überhaupt nicht
bedienen. Für Hilfstechnik existieren sie nicht als Bedienelement — `shell.js`
setzt zwar brav `aria-pressed`, aber ein `<span>` ohne Rolle nimmt das Attribut
nicht an. Der Fokusstil `.chip:focus-visible` in `mp3.css` läuft ins Leere,
weil das Element nie Fokus bekommt. (WCAG 2.1.1, 4.1.2, 2.4.7)

**Korrektur** — Zweigeteilt, weil ein Teil der Chips aus der Engine kommt.

Die elf Chips im eigenen Markup (`body.html`) werden zu Knöpfen — die Engine
spricht sie über `id` an, die Klickbehandlung bleibt unverändert:

```html
<!-- body.html, statt <span class="chip" id="chGuard" title="…">…</span> -->
<button type="button" class="chip" id="chGuard" aria-pressed="false"
        title="Blockt JEDE MIDI-Nachricht auf Kanälen, die keiner
               eingeschalteten Lane gehören">&#9675; Kanalsperre</button>
```

Für die von `buildLanes()` erzeugten Chips, die nicht angefasst werden sollen,
ein Nachrüster in `shell.js` — direkt in `syncPressed()` einhängen:

```js
function armChips(root){
  var c=(root||document).querySelectorAll('.chip:not([tabindex])');
  for(var i=0;i<c.length;i++){
    c[i].setAttribute('role','switch');
    c[i].setAttribute('tabindex','0');
    c[i].addEventListener('keydown',function(e){
      if(e.key===' '||e.key==='Enter'){e.preventDefault();this.click();}
    });
  }
}
```

`armChips()` überall dort aufrufen, wo heute `syncPressed()` steht.

---

### 2. Blues-Werkstatt: Auswahlfeld überdeckt das Etikett daneben

**Wo** — Bereich 3, Karte „Chorus-Bogen", rechte Spalte, Zeile „Bogen über /
Ride ab Chorus" (ca. x=1160–1340, y=505). Im Screenshot steht dort
„4 ChorusRIDE AB CHORUS".

**Warum es stört** — Zwei Beschriftungen liegen übereinander. Der Nutzer liest
weder die eine noch die andere und kann das linke Auswahlfeld an seiner rechten
Kante nicht treffen. Das ist der einzige Punkt in der ganzen Anwendung, der wie
ein Programmfehler aussieht — und er steht in einem Bereich, den man beim
Einrichten eines Stücks als Erstes anfasst.

**Ursache, gemessen** — Die Karte ist 391 px breit, der Formularrahmen 365 px,
das zweispaltige Raster braucht 427 px. Die Container-Abfrage, die auf eine
Spalte zurückfällt, greift erst unter 340 px. `layout.css` setzt zusätzlich
`.view--blues select{min-inline-size:96px}`, wodurch die Spalte nicht mehr
schrumpfen kann.

**Korrektur** — in `layout.css`, ans Ende:

```css
/* Die Rückfallschwelle für mehrspaltige Formulare war zu tief angesetzt:
   ein zweispaltiges Paar braucht Etikett (max. 152px) + Feld (min. 96px)
   zweimal plus Abstände = 427px. Gemessen an der schmalsten Karte, die ein
   .form--2 trägt (Chorus-Bogen, 391px). */
@container card (inline-size < 430px){
  .form--2,.form--3,.form--4{--cols:1}
}
```

Betroffen ist genau die kaputte Karte: „Tempo & Feel" (476 px) und
„Kanal-Routing" (690 px) bleiben zweispaltig.

---

### 3. Lanes: Reglerwerte ragen in das Nachbarfeld

**Wo** — Bereich 4, alle fünf Lane-Zeilen, am deutlichsten bei ARP (y≈590–620):
die Zahl „70" liegt über dem Regler von DENSITY, „8" über dem Auswahlfeld RATE.
Gemessen: vier Überlappungen von je 13 × 18 px.

**Warum es stört** — Genau die Zahlen, wegen derer man in diesen Bereich geht
(Velocity, Density, Streuung), sind zum Teil verdeckt und lassen sich nicht mit
Sicherheit einem Regler zuordnen. Bei ARP steht die Ziffer optisch beim
falschen Bedienelement.

**Ursache, gemessen** — `.lane .field{min-inline-size:78px}` (compat), der
Inhalt `.sl` braucht aber `70px` Regler + `6px` Abstand + `30px` Wertanzeige =
106 px. ARP hat zwei Bedienelemente mehr in derselben Zeile als die übrigen
Lanes und trifft die Untergrenze zuerst.

**Korrektur** — in `compat.css`, im Abschnitt „Lanes":

```css
/* Der Wert darf nie aus seinem Feld herauslaufen: Mindestbreiten so gesetzt,
   dass Regler + Zahl in die 78px passen, die eine Lane-Spur bekommt. */
.lane .sl{min-inline-size:0;overflow:hidden}
.lane input[type=range]{min-inline-size:40px}
.lane .vd{min-inline-size:22px;font-size:var(--fs-micro)}
```

40 + 6 + 22 = 68 px, also 10 px Luft. Die Zeilenhöhe ändert sich nicht.

---

### 4. Lanes: der gekoppelte Swing-Wert ist bei 1,58:1 nicht lesbar

**Wo** — Bereich 4, Spalte „SWING (GEKOPP…)" bei DRUMS, BASS, CHORDS: das Feld
zeigt „global (58 %)" in einem deaktivierten Auswahlfeld.

**Warum es stört** — Der Text ist keine Bedienmöglichkeit, sondern eine
**Auskunft**: er sagt, welchen Swing-Wert die Lane gerade erbt. Deaktivierte
Elemente sind von der Kontrastanforderung ausgenommen, weil sie nichts
mitteilen — hier tun sie es aber. Gemessen 1,58:1 gegen den Feldgrund; auf
einem Studiomonitor bei gedämpftem Licht ist das schlicht weg.

**Korrektur** — in `compat.css`, direkt nach `select:disabled`:

```css
/* Ein gesperrtes Feld, das einen Wert MITTEILT, wird nicht abgeblendet,
   sondern als „nicht editierbar" gezeichnet: versenkte Fläche, gestrichelte
   Kante. Kontrast damit 8,0:1 statt 1,58:1. */
.lane select:disabled{
  opacity:1;background:var(--c-sunken);color:var(--c-text-mute);
  border-color:var(--c-border-soft);border-style:dashed;cursor:not-allowed}
```

---

### 5. ● bedeutet an vier Stellen „aus" — der Zustand ist ohne Farbe falsch ablesbar

**Wo** — Bereich 1: „● INFINITY OFF". Bereich 5: „● CLOCK OFF", „● SLAVE OFF".
Bereich 4: „✓ Tempo/Swing übernehmen" (ausgeschaltet) neben „● Lane On/Off
übernehmen" (eingeschaltet). Gegenprobe im selben Bild: „○ Kanalsperre" (aus)
und „● Groove-Kopplung" (an).

**Warum es stört** — Das Zeichen vor dem Text ist das einzige Merkmal, das den
Zustand ohne Farbwahrnehmung trägt; es ist ausdrücklich so entworfen. In diesen
vier Fällen trägt es das Gegenteil: der gefüllte Punkt steht auf einem
ausgeschalteten Schalter, das Häkchen auf einem ausgeschalteten. Wer sich das
Zeichen einmal als „gefüllt = läuft" eingeprägt hat, liest bei laufender
Aufnahme falsch ab — und bei CLOCK/SLAVE hängt daran, ob eine fremde Uhr das
Tempo bestimmt.

**Korrektur** — Sieben Zeichenketten in der Engine (im gebauten HTML, oder als
`sub1()`-Regel in `build.py`). Ein Wörterbuch: ● = an, ○ = aus, ✓ nirgends.

```
'&#10003; CLOCK AN'            ->  '&#9679; CLOCK AN'
'&#9679; CLOCK OFF'            ->  '&#9675; CLOCK AUS'
'&#10003; SLAVE AN'            ->  '&#9679; SLAVE AN'
'&#9679; SLAVE OFF'            ->  '&#9675; SLAVE AUS'
'&#9679; INFINITY OFF'         ->  '&#9675; INFINITY AUS'
'&#10003; Tempo/Swing über…'   ->  '&#9679; Tempo/Swing übernehmen'
'&#9679; Tempo/Swing über…'    ->  '&#9675; Tempo/Swing übernehmen'
```

Sonderfall im selben Zug: der Schalter „Septakkorde" tauscht beim Umschalten
nicht den Zustand, sondern das Wort („● Septakkorde" ↔ „○ Dreiklänge"). Ein
Schalter, dessen Beschriftung wechselt, ist keiner. Entweder das Wort festhalten
(`innerHTML=on?'&#9679; Septakkorde':'&#9675; Septakkorde'`) oder — sauberer —
den bereits in `mp3.css` vorhandenen, bislang ungenutzten `.segment`-Baustein
einsetzen: zwei Knöpfe „Dreiklänge | Septakkorde" mit `role="radio"`.

---

### 6. Die Seitenleiste schneidet genau den Eintrag ab, auf den man sieht

**Wo** — Bereich 1 zeigt „MIDI & Trans…", Bereich 6 zeigt „Export & Set…".
In allen anderen Bildern stehen dieselben Einträge vollständig da.

**Warum es stört** — Der aktive Eintrag wird auf `font-weight:600` gesetzt; der
Text wächst dadurch von 111 px auf 124 px, das Kästchen bleibt bei 111 px. Es
wird also immer nur der eine Eintrag gekürzt, den man gerade benutzt — die
Beschriftung verschwindet in dem Moment, in dem man sie bestätigt bekommen
möchte. Der aktive Zustand ist ohnehin schon dreifach markiert (Füllung,
Rahmen, Randmarke links, dazu das cyanfarbene Symbol); die Fettung ist das
vierte Merkmal und das einzige, das etwas kaputt macht.

**Korrektur** — in `layout.css`:

```css
/* Aktiv wird über Fläche, Rahmen, Randmarke und Symbolfarbe angezeigt — das
   reicht. Die Fettung änderte die Textbreite und kürzte ausgerechnet den
   aktiven Eintrag (gemessen 124px Text in 111px Kasten). */
.rail-item[aria-current="page"]{font-weight:500}
:root{--w-rail:212px}   /* 12px Luft, damit auch „Blues-Werkstatt" atmen kann */
```

---

## SOLLTE

### 7. Zwei Fokusringe in einer Anwendung

`mp3.css` zeichnet den Ring mit `outline-offset:2px`, `compat.css` überschreibt
ihn für `button`, `select`, `input` mit `outline-offset:1px` (höhere
Spezifität). Gemessen: Knöpfe und Felder 2 px/1 px, Seitenleisteneinträge und
Aufklapper 2 px/2 px. Beim Durchtabben springt der Ring dadurch sichtbar näher
und weiter ans Element.

**Korrektur** — in `compat.css` den Block ab `select:focus-visible,` (Zeilen
26–28) **ersatzlos streichen**. Die Regel in `mp3.css` deckt dieselben Elemente
über `:where(a,button,select,input,textarea,summary,[tabindex])` bereits ab.

### 8. Englische Reste in der deutschen Ansicht

Sichtbar: „Initializing…" in der Transportleiste (Bereich 1, rechts — das
Auswahlfeld darunter sagt an derselben Stelle korrekt „Initialisiere…"),
„Bar 1 … Bar 12" auf den Takt-Kacheln unter der Überschrift „TAKTE" (Bereich 2),
„Preset / Bars / Chord / Default Type / Apply" (Bereich 2, Akkordfolge),
„Undo" (Bereich 2, Reharmonisierung). Swing, Velocity, Style, Turnaround,
Count-In, Program Change sind Fachbegriffe und bleiben richtig, wo sie stehen.

**Korrektur** — Zeichenketten, `body.html` bzw. Engine:
`Initializing…` → `Initialisiere…`; `'Bar '+n` → `'Takt '+n`;
`Bars / Chord` → `Takte pro Akkord`; `Default Type` → `Standard-Typ`;
`Apply` → `Übernehmen`; `Undo` → `Rückgängig`.
Bei den Takt-Kacheln ist das zusätzlich ein Kontextfehler: die Karte heißt
„Takte", die Kacheln darin „Bar".

### 9. Zwei Etikettenausrichtungen in ein und derselben Karte

Bereich 2, Karte „Akkordfolge": „PROGRESSION" steht **neben** dem Eingabefeld,
drei Zeilen darunter stehen „PRESET", „BARS / CHORD", „DEFAULT TYPE" **über**
ihren Feldern. Gemessen und im Bild deutlich. Das Auge muss innerhalb einer
Karte zweimal umlernen, wo die Beschriftung zu suchen ist. Dieselbe Mischung in
„Tonart" und „Generator".

**Korrektur** — `body.html`, die drei `.field`-Blöcke auf das Formularraster
umstellen (die Karte ist 1212 px breit, drei Paare passen bequem):

```html
<div class="form form--3" style="margin-top:8px">
  <label class="lbl" for="progPreset">Preset</label>
  <select id="progPreset">…</select>
  <label class="lbl" for="barsPerChord">Takte pro Akkord</label>
  <select id="barsPerChord">…</select>
  <label class="lbl" for="defType">Standard-Typ</label>
  <select id="defType">…</select>
</div>
<div class="row row--tight">
  <button class="btn bpl" id="btnApply">Übernehmen</button>
  <button class="rh undo" id="btnClear">&#10006; Leeren</button>
  <span class="err grow" id="seqErr"></span>
</div>
```

Nebeneffekt: die Knöpfe stehen dann nicht mehr auf der Grundlinie von drei
verschieden hohen Feldstapeln, sondern in einer eigenen Zeile.

### 10. Die Hauptaktion hat je Bereich eine andere Farbe

Bereich 2 „Übernehmen" cyan, im selben Bereich „✦ Generieren" violett;
Bereich 3 „Progression bauen" cyan; Bereich 6 „.MID exportieren" und
„Setup speichern" grün. Vier Farben für dieselbe Rolle. Gleichzeitig ist
„🎲 Alle Styles würfeln" (Bereich 4) ein Umrissknopf, während der Würfel in
der Transportleiste violett gefüllt ist — dieselbe Handlung, zwei Gewichte.

**Korrektur** — eine Regel, drei Klassenwechsel in `body.html`:
cyan (`btn bpl`) = die eine Hauptaktion der Karte · violett (`btn bdice`) =
alles, was würfelt · grün (`btn bexp`) = alles, was eine Datei erzeugt.
Konkret: `#btnGenProg` von `bdice` auf `bpl`, `#btnStyleDice` von `rh` auf
`btn bdice`.

### 11. Löschende Knöpfe sehen aus wie alle anderen

„✖ Leeren" (Bereich 2), „✖ Löschen" (Bereich 6) und „↺ Lane-Zustand
zurücksetzen" (Bereich 1) sind `.rh.undo` — gemessen identisch zu einem
gewöhnlichen `.rh`: gleiche Fläche, gleicher Rahmen `rgb(74,127,196)`. Rot
werden sie erst beim Überfahren. Wer mit der Tastatur bedient, sieht die
Warnung nie; wer zielt, sieht sie zu spät.

**Korrektur** — in `compat.css` bei `.rh.undo`:

```css
/* Zerstörende Handlungen sind dauerhaft markiert, nicht erst im Hover. */
#btnClear,#btnSuDel,#btnResetLanes{
  border-color:color-mix(in srgb,var(--c-err) 60%,var(--c-border-ctl));
  color:var(--c-err)}
```

`↺ Undo` bleibt bewusst neutral — es stellt wieder her, es zerstört nicht.

### 12. Farbige Emoji zwischen einfarbigen Zeichen

Die Kartentitel sind ein sauberes System: cyanfarbenes Zeichen, gesperrte
Versalien. Dazwischen stehen 💾 (Setups, MIDI Export, Seitenleiste), 📜
(Protokoll), 🎲, 🎮, 🎸, 🔍 — die rendert Chrome in Vollfarbe und ignoriert
dabei die Textfarbe. In den Screenshots fällt das gedämpft aus, weil dem
Aufnahmebrowser die Emoji-Schrift fehlt; auf dem Zielrechner werden diese
Zeichen bunt. Neben ⚡ ⇄ ♫ ▦ ✦ ⚙, die alle brav die Cyan-Farbe des Titels
annehmen, sieht das wie ein zweiter Absender aus.

**Korrektur** — Zeichen tauschen, `body.html` und Engine:
💾 → `▤` (U+25A4) · 📜 → `☰` (U+2630) · 🎲 → `⚄` (U+2684) · 🎮 → `⚄` ·
🎸 → `♪` · 🔍 → `⌕` (U+2315) · 🔒 (Takt-Sperre) → `⚿` (U+26BF).
Alle sind einfarbig und nehmen `currentColor` an.

### 13. Drei Bereiche sind zur Hälfte leer, ohne dass es dafür einen Grund gibt

Gemessen als freier Raum unter der untersten Karte je Rasterspalte:

| Bereich | Spalte 1 | Spalte 2 | Spalte 3 |
|---|---|---|---|
| Sync | 362 px | 552 px | 362 px |
| Blues | 104 px | **503 px** | 171 px |
| MIDI | 61 px | **306 px** | — |
| Export | 314 px | 242 px | — |

Der Vorgänger scrollte endlos, das ist behoben — aber „passt aufs Bild" ist
nicht dasselbe wie „nutzt das Bild". Bei Sync liegt mehr als die halbe Fläche
brach, während die Anleitung, die genau dorthin gehört, zugeklappt in einer
40-px-Zeile steckt und beim Öffnen intern um 164 px scrollt.

**Korrektur, Sync** — die Anleitung aufgeklappt in die freie Fläche legen:

```html
<!-- body.html: Anleitung als breite, offene Karte in Zeile 2 -->
<details class="card card--span2" open>
  <summary><h2 class="card-title"><span>&#9432; Anleitung</span></h2></summary>
  <div class="hint2 scroll-y" id="hintSync"></div>
</details>
```

```css
/* layout.css */
.view--sync{grid-template-rows:auto minmax(0,1fr)}
.view--sync .scroll-y{max-block-size:none}
```

**Korrektur, Blues** — die fünf Karten haben sehr ungleiche Höhen (Form 314,
Transposition 226, Groove 141, Tempofelder 90, Chorus-Bogen 230). Solange sie
direkte Rasterkinder sind, richtet sich die Zeilenhöhe nach der größten und
Groove hinterlässt ein 200-px-Loch. In `body.html` je Spalte in eine `.col`
fassen — die Klasse existiert und `layout.css` bereitet sie schon vor:

```html
<div class="col"><!-- Form, Tempofelder --></div>
<div class="col"><!-- Transposition, Groove --></div>
<div class="col"><!-- Chorus-Bogen, Hinweise --></div>
```

Ergebnis rechnerisch: 404 / 367 / 270 px statt 314 / 226 / 371 mit Loch.
Die Regel `.view--blues{align-items:start}` in `layout.css` wird damit
gegenstandslos — sie wurde nur gebraucht, weil die Karten direkte Rasterkinder
waren.

**Korrektur, MIDI** — das Protokoll über die volle Breite unter beide Spalten
legen; damit verschwinden beide Löcher auf einmal:

```html
<!-- body.html: die Protokoll-Karte aus der linken .col herausziehen -->
<article class="card card--full card--fill"> … Protokoll … </article>
```

```css
/* layout.css */
.view--midi{grid-template-columns:7fr 5fr;grid-template-rows:auto minmax(0,1fr)}
.view--midi>.col{grid-row:1}
```

### 14. Der Monitor zeigt eine leere schwarze Fläche ohne Erklärung

Bereich 7, rechte Karte: 540 px hoch, vollständig leer. Der Hinweis „Nur wenn
eingeschaltet" steht klein in der Titelzeile, sagt aber nicht, **wo** man
einschaltet.

**Korrektur** — in `layout.css`:

```css
#mlog:empty::before{
  content:"Der MIDI-Monitor ist aus. Einschalten unter MIDI & Transport.";
  color:var(--c-text-mute);font-family:var(--ff);font-size:var(--fs-sm)}
```

(Für die englische Ansicht denselben Text über `:root[data-lang="en"] #mlog:empty::before`
nachziehen, sobald `data-lang` gesetzt wird.)

### 15. Ein Bedienelement steckt in einer Überschrift

Bereich 2, Karte „Stufen": der Schalter „Septakkorde" sitzt im `<h2
class="card-title">`. In jeder anderen Karte der Anwendung enthält der rechte
Platz der Titelzeile einen stillen Hinweistext, nie ein Bedienelement. Hier ist
es plötzlich etwas Klickbares —
und für Hilfstechnik lautet die Überschrift „Stufen ● Septakkorde".

**Korrektur** — in `body.html` den Schalter aus dem `<h2>` heraus in eine
`.row` direkt darunter verschieben, wie in „Groove" und „Chorus-Bogen".

### 16. Groß- und Kleinschreibung der Knöpfe ist gemischt

Nebeneinander in Bereich 1: „→ einen Kanal legen", „→ ab Startkanal verteilen"
gegen „🎸 GM-Standardsounds". In Bereich 2/3: „🔍 erkennen", „→ transponieren",
„↻ Übungs-Zirkel weiter" gegen „Progression bauen", „Band laden". Gleiche
Knopfart, zwei Schreibweisen.

**Korrektur** — Eine Regel: Knopfbeschriftungen beginnen groß, weil sie
Handlungen benennen. Also „→ Einen Kanal legen", „→ Ab Startkanal verteilen",
„🔍 Erkennen", „→ Transponieren". Rein in `body.html`.

### 17. Das MIDI-Protokoll läuft mit 10 px

`.mlog` steht auf `--fs-micro`. Die ausdrückliche Ausnahme lautet „10 px nur für
Zahlen" — der Monitor schreibt aber ganze Zeilen („BLOCK Ch10 Note On …").

**Korrektur** — in `compat.css`: `.mlog{font-size:var(--fs-sm)}` (12 px). Die
Karte ist 540 px hoch, der Platz ist da.

### 18. Zwei Bausteinsprachen nebeneinander — messbar

45 Klassen aus `mp3.css` kommen im fertigen Dokument nicht ein einziges Mal vor:
`btn--primary`, `btn--secondary`, `btn--ghost`, `btn--danger`, `btn--violet`,
`btn--ok`, `segment`, `status`, `lane-card`, `lane-controls`, `bar-cell`,
`suggest`, `circle-of-fifths`, `key-chip`, `ch-cell`, `channels`, `monitor`,
`key-w`, `key-b`, `slider`, `slider-val`, `chip--lock`, `chip--inf`,
`chip--lane`, `section-head`, `sr-only`, `form--3`, `form--4` und weitere.
Ihre Aufgabe erfüllen `.bpl/.bst/.bdice/.bexp/.rh/.tgl/.cb/.sug/.deg/.lane/
.chcell/.mlog/.kw/.kb` aus `compat.css`.

Schlimmer als die tote Fracht sind die **acht doppelt belegten Namen**: `.btn`
(Radius 8 px in `mp3.css`, 6 px in `compat.css`), `.row` (`align-items:center`
gegen `flex-end` — gemessen gewinnt `flex-end`), `.field` (`grid` gegen `flex`),
`.chip`, `.log`, `.dot`, `.stack`, `.sug`/`.deg`. `.mono`, `.grow` und `.nowrap`
stehen sogar dreimal da. Wer künftig eine Zahl in `mp3.css` ändert, sieht
nichts passieren und sucht an der falschen Stelle.

**Korrektur** — kein Umbau, sondern Ehrlichkeit: in `mp3.css` die Abschnitte 08
(Knöpfe/Chips/Regler), 09 (Lane-Karte), 10 (Takt-Kacheln/Vorschläge) und 11
(Log/Kanäle) auf das reduzieren, was tatsächlich greift, und die acht doppelten
Namen dort löschen, wo `compat.css` sie ohnehin überschreibt. Alternativ die
ungenutzten Blöcke mit einem Kommentar „Reserve, greift derzeit nicht"
kennzeichnen. Beides ist besser als der jetzige Zustand, in dem zwei
gleichlautende Wahrheiten in derselben `<style>`-Insel stehen.

### 19. Die Vorschlagsliste ist um 6 px angeschnitten

Bereich 2, Karte „Nächster Akkord": die dritte Kachelreihe („V7/I E7",
„subV7 A#7", „♭VII7 G7") wird von der Kartenkante durchgeschnitten. Gemessen:
`scrollHeight − clientHeight = 6 px`. Ein 6-px-Rest sieht nicht nach „hier geht
es weiter" aus, sondern nach Fehler.

**Korrektur** — in `layout.css` bei `.view--song .sugrow`:

```css
.view--song .sugrow{max-block-size:132px;
  mask-image:linear-gradient(to bottom,#000 calc(100% - 16px),transparent)}
```

Die ausblendende Kante sagt eindeutig „da ist mehr", ohne Höhe zu kosten.

---

## KANN

### 20. Drei Knopfhöhen in der Transportleiste
Gemessen: PLAY/STOP/Würfel 32 px, „💾 Setup" 34 px (aus
`layout.css: .transport .rh{block-size:34px}`), Sprachumschalter 32 px,
Lane-Kürzel 30 px. Die Spezifikation sah für die Transport-Hauptknöpfe 38 px
vor (`--h-ctl-lg`); angekommen sind 32.
**Korrektur** in `layout.css`, ersetzt die vorhandene 34-px-Zeile:
`.transport .btn,.transport .rh,.transport .lang-toggle,.transport .tbl{block-size:34px}`

### 21. Die Klaviatur endet 290 px vor dem Fensterrand
Gemessen: Dock 1440 px, Tastatur 1150 px (50 weiße Tasten à 23 px), Rest
schwarz. Das liest sich wie ein abgeschnittenes Instrument.
**Korrektur** in `layout.css`: `.piano{margin-inline:auto}` — die Tastatur steht
dann mittig, bei schmalerem Fenster scrollt sie weiterhin.

### 22. Der Einklapp-Knopf der Klaviatur ist 24 px hoch
Unter der selbstgesetzten 32-px-Grenze und der kleinste Treffer der Anwendung.
Er sitzt in einer 30 px hohen Leiste — für 32 px müsste
`--h-piano-min` auf 34 px, was 4 px Inhaltshöhe kostet. Vertretbar, aber eine
bewusste Entscheidung.

### 23. „Gespeicherte Setups": das Etikett schwebt in der Mitte
Bereich 6. Das Listenfeld ist 120 px hoch, `.form` zentriert vertikal, also
steht „GESPEICHERTE SETUPS" auf halber Höhe daneben und wirkt losgelöst.
**Korrektur** in `layout.css`:
`.form>.lbl:has(+ .su-list){align-self:start;margin-block-start:9px}`

### 24. Der Taktzähler zeigt im Ruhezustand „--" über „--"
Bereich 1, Transportleiste. Zwei Striche übereinander sehen aus wie ein
Ladefehler. „1.1" und „LOOP 1/4" wären ehrlicher und würden die Breite gleich
mit reservieren. Daneben hält `#mtag` 84 px leere Breite frei.

### 25. Das Tastenkürzel zeigt ⌥, die Werkzeugtipps sagen „Strg"
`layout.css` setzt `.rail-item kbd::before{content:'\2325'}` — das ist das
macOS-Wahltastenzeichen. Die Werkzeugtipps derselben Anwendung sprechen von
„Cmd/Strg+S", das Ziel ist Cubase unter Chrome. Besser: das Zeichen aus der
Seitenleiste nehmen (es kostet dort Breite, siehe Punkt 6) und in die
Kürzel-Legende unten eine Zeile ergänzen: `<kbd>Alt</kbd>+<kbd>1–7</kbd> Bereiche`.

### 26. Der Fokusring blendet sich ein
`.btn` in `compat.css` überträgt `box-shadow`; der dunkle Innenring des
Fokusrings wird dadurch über 150 ms eingeblendet (im Messlauf mitten in der
Animation erwischt: 0,065 px statt 2 px). Fokus soll sofort da sein.
**Korrektur**: in der `transition`-Liste von `.btn` `box-shadow` streichen.

### 27. Bereichswechsel wird nicht angesagt
`showView()` blendet `<section hidden>` um, verschiebt aber den Fokus nicht.
Nach Alt+3 steht der Fokus weiterhin auf dem alten Element, Hilfstechnik sagt
nichts. Ein `sec.setAttribute('tabindex','-1'); sec.focus()` in `shell.js`
genügt. Passend dazu fehlt dem Dokument ein `<h1>` — `.rail-brand` wäre der
natürliche Ort.

### 28. „1x Progression" neben „2x", „4x", „8x"
Bereich 6, Auswahlfeld Wiederholungen: die erste Option ist anders formuliert
als die drei folgenden. Entweder überall das Substantiv oder nirgends.

---

## Was gut ist

- **Monitor** (Bereich 7) ist die stärkste Seite: eine Kopfzeile mit 16 gleich
  gebauten Kanalzellen, darunter zwei gleich große Flächen. Nichts zu ändern
  außer dem leeren Zustand rechts (Punkt 14).
- **Lanes** trägt die Lane-Identität konsequent durch: farbige Kante links,
  farbiger Name, gleiche Spurenfolge in jeder Zeile. Die fünf Zeilen lesen sich
  wie ein Mischpult. Sobald die Werte nicht mehr überlappen (Punkt 3), ist das
  der beste Bereich der Anwendung.
- **Das Protokoll** macht Semantik ohne Farbe vorbildlich: `·`, `✓`, `⚠`, `✗`,
  `✦` vor jeder Zeile, Farbe nur zusätzlich. Genau so gehört es.
- **Die Kartentitel** sind über alle sieben Bereiche identisch aufgebaut —
  Zeichen, gesperrte Versalien in Cyan, rechtsbündiger Hinweis, Trennlinie.
  Das ist der Anker, an dem sich das Auge in jedem Bereich sofort orientiert.
- **Die Farbkorrekturen gegenüber MIDI PERFECT 2** halten, wo sie greifen:
  Sekundärknöpfe 10,6:1, Seitenleiste 10,6:1, Routing-Zeile 10,0:1, Chips im
  Aus-Zustand 7,3:1. Die Ausreißer stehen oben, aber die Grundskala stimmt.
- **`layout.css` ist gut begründet.** Jede Dichtekorrektur nennt die Messung,
  die sie ausgelöst hat. Genau diese Disziplin fehlt nur an den vier Stellen,
  an denen sie nachträglich Schaden anrichtet (Punkte 2, 3, 6, 25).
