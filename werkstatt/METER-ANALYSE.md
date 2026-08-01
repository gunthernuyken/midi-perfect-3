# Taktarten 3/4 und 6/8 — was das wirklich kostet

Vollständige Durchsicht von `MIDI PERFECT 3.html` (rund 4000 Zeilen JavaScript).

## Kurzfassung

**Rund 270 Codestellen sind betroffen. Davon sind ~45 mechanisch, der Rest ist
musikalische Handarbeit.**

Der mechanische Teil ist harmlos: `BAR = PPQ * 4` steht genau einmal, und
**alle 22 Verwendungen von `BAR` meinen tatsächlich „Länge eines Taktes"** —
keine einzige missbraucht die Konstante als „vier Schläge". Ein Meter-Objekt
statt der Konstante löst Takt-Offsets, Loop-Länge, Taktzähler, Count-In,
Clock-Burst und die Export-Taktzahl in einem Zug.

Der Rest ist das Problem.

## Was neu geschrieben werden muss

| Bereich | Umfang | Warum nicht mechanisch |
|---|---|---|
| Drum-Patterns | **43** (grid 12: 5 · grid 16: 37 · grid 32: 1) | Jede Maske ist eine Aussage über vier Schläge. `step = BAR/grid` rechnet zwar automatisch, aber 16 Sechzehntel auf drei Vierteln sind musikalisch Unsinn. |
| Drum-Fills | **8** Masken + harter Start auf `t0+2*Q` | Alle 8 Zeichen lang = zweite Hälfte eines 4/4-Takts. In 3/4 gibt es keine Hälfte. |
| Bass-Styles | **28 von 31** | Handgeschriebene Figuren. `halfNotes` und `twoFeel` (zwei Halbe) sind in 3/4 schlicht unmöglich. |
| Chord-Styles | **24 von 27** | `charleston`, `blockBeats`, `pop4`, `montuno`, `reggaeSkank` sind per Definition 4/4-Figuren. |
| Melodie-Motive | **9 Rhythmuszellen** (`RCELLS`) | Zelle 6 ist eine Halbe plus zwei Viertel. |
| Melodie-Spezial | **9 Styles** | 16tel-Indexlisten bis Position 14 — laufen in 3/4 über die Taktgrenze. |
| Arp | nur **4 Stellen** | Der Arp leitet seine Tonhöhen aus dem Akkord ab und sein Raster aus `RATES`. Mit Abstand der taktartfreundlichste Generator. |

## Die drei heiklen Stellen

**1. Die Drum-Masken.** Ein Teil hat keine sinnvolle 3/4-Entsprechung —
Reggaeton, Trap, Amen Break, Dembow. Die gehören in der Auswahl **ausgeblendet**,
nicht zwangsweise umgerechnet. Eine Drum-Auswahl, die 43 Einträge zeigt, von
denen 15 in der eingestellten Taktart Müll produzieren, ist schlechter als eine
mit 12 richtigen.

**2. 6/8 und die Frage, was ein Schlag ist.** Vier Funktionen hängen am
Viertel als Zählzeit:

- `applySwing` — `t % Q`
- `applyBackbeat` — `r-Q`, `r-3*Q` (Schlag 2 und 4)
- `applyArrangement` — `on13 = (rb===0 || rb===2*Q)` („auf 1 und 3")
- `applyChorus` — Ride-Bell nur auf Vierteln

In 6/8 ist die Zählzeit die **punktierte Viertel**. Ein 6/8-Takt hat zwei
legitime Lesarten (zwei punktierte Viertel oder sechs Achtel) — Swing, Akzent,
Arrangement und Beat-Anzeige müssen sich auf **dieselbe** einigen, sonst laufen
sie gegeneinander.

Nebenbei: 6/8 wird heute schon gefälscht. Das Tempofeld „Slow Blues 12/8" setzt
Swing auf 98 und der Chord-Style heißt `gospel128` — beides 4/4 mit maximalem
Shuffle. Echtes 6/8 würde diese Krücke ersetzen.

**3. Backbeat in 3/4 gibt es nicht.** Im Rock-Sinn ist der Backbeat 2 und 4.
Ein Walzer hat einen schweren Schlag 1 und zwei leichte. Der Regler braucht je
Taktart eine eigene Bedeutung, keine Umrechnung.

## Cubase-Synchronisation — was geht und was nicht

**MIDI Clock überträgt keine Taktart. Das ist keine Lücke in dieser Anwendung,
das steht so in der MIDI-Spezifikation.** Übertragen werden 24 Ticks pro
Viertelnote, Start, Stop und Position — mehr nicht.

Was tatsächlich geht:

- **SMF-Export.** Zeile 5025 schreibt heute hart `FF 58 04 04 02 18 08` —
  ein echtes Time-Signature-Meta-Event, fest auf 4/4. Drei Bytes tauschen und
  der Export trägt die richtige Taktart in jede DAW:
  - 3/4 → `03 02 18 08`
  - 6/8 → `06 03 24 08`
  Bleibt das stehen, zeigt Cubase den Export in 4/4 an, egal wie richtig der
  Rest ist.
- **Song Position Pointer** zählt Sechzehntel und ist taktartunabhängig — die
  Position stimmt also weiter. Nur der *Taktzähler* in Cubase zeigt etwas
  anderes, wenn dort 4/4 eingestellt ist.
- **Ein Hinweis beim Umschalten**, dass die Taktart in Cubase von Hand
  mitgezogen werden muss. Ehrlich stumm ist besser als heimlich falsch.

## Empfohlene Architektur

Nicht `BAR` umschreiben, sondern ein Meter-Objekt einführen, das alle offenen
Fragen an einer Stelle beantwortet:

```js
var METERS = {
  '4/4': { barTicks:1920, beats:4, beatTicks:480,
           pulse:4, pulseTicks:480,
           swingUnit:480, backbeats:[480,1440], arrOn:[0,960],
           defaultGrid:16, smf:[0x04,0x02,0x18,0x08] },
  '3/4': { barTicks:1440, beats:3, beatTicks:480,
           pulse:3, pulseTicks:480,
           swingUnit:480, backbeats:[480], arrOn:[0],
           defaultGrid:12, smf:[0x03,0x02,0x18,0x08] },
  '6/8': { barTicks:1440, beats:6, beatTicks:240,
           pulse:2, pulseTicks:720,
           swingUnit:720, backbeats:[720], arrOn:[0,720],
           defaultGrid:12, smf:[0x06,0x03,0x24,0x08] }
};
```

Damit werden Swing, Backbeat, Arrangement, Beat-Punkte, Count-In, Clock-Burst
und der SMF-Header **je ein Feldzugriff**. Was danach übrig bleibt, ist reine
Musik: Patterns und Style-Figuren.

Die Patterns bekommen ein optionales Feld statt einer Umrechnung:

```js
rock8: { name:'Rock 8tel', grid:16, rows:[...],
         meters:{ '3/4':{grid:12, rows:[...]} } }   // 6/8 fehlt -> ausgeblendet
```

Ein Style ohne Eintrag für die eingestellte Taktart erscheint gar nicht erst in
der Auswahl. Das ist der Unterschied zwischen einem Werkzeug und einem
Zufallsgenerator.

## Aufwandsschätzung

| Stufe | Inhalt | Ergebnis |
|---|---|---|
| **1 — Gerüst** | Meter-Objekt, `BAR` variabel, Beat-Punkte dynamisch, SMF-Meta-Event, Taktart-Auswahl in der Oberfläche, Cubase-Hinweis, Persistenz im Setup | 3/4 und 6/8 laufen technisch sauber; die vorhandenen Styles klingen aber falsch |
| **2 — Kern-Patterns** | 10–14 Drum-Patterns je Taktart, 3 Fills je Taktart, 8–10 Bass- und 8–10 Chord-Figuren, Backbeat/Arrangement je Taktart, Style-Filter | Walzer und 6/8-Blues sind wirklich spielbar |
| **3 — Vollausbau** | alle 43 Patterns, alle 31 Bass- und 27 Chord-Styles, `RCELLS` je Taktart | vollständige Parität mit 4/4 |

Stufe 1 ohne Stufe 2 ist eine Falle: die Anwendung *sagt* dann 3/4 und
*klingt* nach zerhacktem 4/4. Beide gehören zusammen ausgeliefert.
