# Cubase-Setup

MIDI PERFECT 3 sendet auf denselben Kanälen und mit derselben Sync-Technik
wie Version 2 — ein für Version 2 eingerichtetes Cubase-Projekt funktioniert
unverändert. Dieses Dokument ist die V3-Fassung; die Bedienelemente liegen
jetzt in den Bereichen **MIDI & Transport** (Routing) und **Sync**
(Clock/MMC), nicht mehr in Panels.

## 1 IAC-Treiber (macOS)

Audio-MIDI-Setup → MIDI-Studio → IAC-Treiber → „Gerät ist online"
aktivieren. Ohne den virtuellen Port sieht der Browser keinen MIDI-Ausgang;
die Anwendung meldet dann „Kein MIDI-Output".

## 2 Anschlüsse in Cubase

Studio-Einstellungen → MIDI-Anschlüsse: `IAC-Treiber Bus 1` muss als
Eingang sichtbar und aktiv sein. „In All MIDI Inputs" kann aktiviert
bleiben — ist aber die häufigste Fehlerquelle (siehe Falle 1).

## 3 Spuren anlegen

Eine MIDI-Spur pro Lane; die Spur arbeitet als Kanal-Umsetzer:

| Lane | sendet auf | Spur-Eingang | typisches Ziel |
|---|---|---|---|
| DRUMS | Ch 10 | Kanal 10 | Groove Agent |
| BASS | Ch 1 | Kanal 1 | Bass-Instrument |
| CHORDS | Ch 2 | Kanal 2 | E-Piano/Pads |
| ARP | Ch 3 | Kanal 3 | Synth |
| MELODY | Ch 4 | Kanal 4 | Lead |

Die tatsächliche Belegung zeigt der Bereich **Monitor** (Kanal-Belegung,
Zellen blitzen bei gesendeten Noten).

## 4 Falle 1: Spur-Eingang „Alle Eingänge"

Steht der Eingangskanal der Spur auf „Any", nimmt sie **alle** Kanäle an —
jede Spur spielt dann alles. Eingangskanal explizit auf den Lane-Kanal
stellen.

## 5 Falle 2: Groove Agent hört nicht auf Kanal 10

Groove Agent legt seine Kits auf die Kanäle 1–4. Die Drum-Spur filtert
deshalb Eingang Kanal 10 und gibt auf Kanal 1 aus — Umsetzung über die
Spur, nicht über das Plugin.

## 6 Falle 3: Mehrstimmige Plugins

Instrumente mit mehreren Slots (HALion, Kontakt) erwarten je Slot einen
eigenen Kanal. Auch hier: Ausgangskanal der Spur anpassen, Plugin
unangetastet lassen.

## 7 Falle 4: Monitor statt Aufnahmebereitschaft

Zum Mithören den **Monitor-Knopf** der Spur aktivieren (Lautsprecher-
Symbol). Aufnahmebereitschaft allein reicht in manchen Konfigurationen
nicht und gehört nur zum tatsächlichen Recording.

## 8 Transport-Sync (Bereich „Sync")

Zwei unabhängige Mechanismen:

- **MIDI Clock** (Tempo/Position): CLOCK AN schalten. In Cubase:
  Transport → Projekt-Synchronisationseinstellungen → Quelle „MIDI-Timecode/
  Clock" vom IAC-Bus. Der kürzere Clock-Vorlauf (~70 ms) lässt
  Tempoänderungen praktisch verzögerungsfrei folgen; der Knopf
  „Tempo übernehmen" schickt einen Clock-Burst als Handshake.
- **MMC** (Play/Record/Stop per SysEx): in Cubase MMC-Slave aktivieren,
  Gerätekennung passend zur Einstellung im Sync-Bereich (Standard 127 =
  alle). „Aktion bei Play" bestimmt, ob Cubase nur mitläuft oder aufnimmt;
  Count-In lässt Cubase starten, bevor die ersten Noten kommen.

Als **Clock-Slave** läuft der Generator umgekehrt zu Cubase' Tempo: SLAVE
AN, in Cubase MIDI-Clock-Ausgang auf einen IAC-Bus legen. Eigene
Clock-Ausstrahlung wird dann automatisch unterdrückt (Rückkopplungsschutz).

## 9 Checkliste bei Stille

1. Läuft der Transport? (Play leuchtet, Takt-Zähler zählt)
2. Bereich Monitor: blitzen Kanal-Zellen? Wenn nein → Lane eingeschaltet?
3. MIDI-Ausgang auf `IAC-Treiber Bus 1`? (Bereich MIDI & Transport)
4. Cubase: kommt Signal an der Spur an? (Eingangspegel der Spur)
5. Spur-Eingangskanal = Lane-Kanal? Monitor-Knopf aktiv?
6. Instrument-Ausgang hörbar geroutet?

## 10 Projekt speichern

Das komplette Spur-Routing liegt in der `.cpr`-Datei. Einmal eingerichtet,
als Vorlage sichern — die Anwendung selbst merkt sich ihre Seite über
Setups (`Export & Setups`) und den automatischen Schnappschuss beim
Schließen.
