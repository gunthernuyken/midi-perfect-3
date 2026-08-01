# -*- coding: utf-8 -*-
"""Baut MIDI PERFECT 3 aus der Engine von MIDI PERFECT 2 und der neuen Hülle.

Die Engine wird NICHT umgeschrieben. Entfernt werden nur die Teile, die es in
der neuen Hülle nicht mehr gibt: die zweite Transportleiste samt ihrer
Abgleichschleife und die Klapp-Panel-Logik, die der Router ersetzt.
"""
import io, re, sys

MP2   = '/tmp/out/MIDI PERFECT 2.html'
DST   = '/tmp/mp3/MIDI PERFECT 3.html'
BUILD = 'BUILD 2026-08-01-Q'

src   = io.open(MP2, encoding='utf-8').read()
css   = io.open('/tmp/design/mp3.css', encoding='utf-8').read()
compat= io.open('/tmp/mp3/compat.css', encoding='utf-8').read()
layout= io.open('/tmp/mp3/layout.css', encoding='utf-8').read()
body  = io.open('/tmp/mp3/body.html', encoding='utf-8').read()
shell = io.open('/tmp/mp3/shell.js', encoding='utf-8').read()

head, rest = src.split('<script>\n"use strict";', 1)
engine     = rest.rsplit('</script>', 1)[0]

def cut(text, start, end, what):
    """Schneidet von start bis (ausschliesslich) end heraus."""
    i = text.find(start)
    if i < 0:
        raise SystemExit('Anker fehlt (%s): %r' % (what, start[:70]))
    j = text.find(end, i)
    if j < 0:
        raise SystemExit('Endanker fehlt (%s)' % what)
    return text[:i] + text[j:]

def sub1(text, old, new, what):
    if text.count(old) != 1:
        raise SystemExit('%s: %d Treffer statt 1 fuer %r' % (what, text.count(old), old[:70]))
    return text.replace(old, new)

# --- 1 Zweite Transportleiste entfernt ------------------------------------
engine = cut(engine,
    "/* --- Kommandoleiste --- */\ndocument.getElementById('tbPlay')",
    "document.getElementById('tbLanes')",
    'tb-Knoepfe')

# --- 2 Klapp-Panels: ersetzt durch Router und <details> -------------------
engine = cut(engine,
    "/* --- Panels auf-/zuklappen, Zustand merken --- */",
    "/* --- Kommandoleiste spiegelt",
    'Panel-Klapplogik')

engine = cut(engine,
    "/* --- Kommandoleiste spiegelt den echten Transport",
    "\n/* ============================================================\n   10b",
    'tbSync-Schleife')

# --- 3 BUG: TYPESUF war zweimal deklariert -------------------------------
# Die zweite Deklaration in der Blues-Werkstatt ueberschreibt die erste zur
# Laufzeit. Sie kennt m7b5, dim, aug, sus4, 6, m6, 7#9 und sus2 nicht - der
# Quintenzirkel und die Stufenanzeige schrieben deshalb "C#undefined".
engine = sub1(engine,
    "var TYPESUF={'7':'7','9':'9','m7':'m7','maj7':'maj7','dim7':'dim7','7b9':'7b9','min':'m','maj':'','m9':'m9','13':'13'};",
    "var BLUESSUF={'7':'7','9':'9','m7':'m7','maj7':'maj7','dim7':'dim7','7b9':'7b9','min':'m','maj':'','m9':'m9','13':'13'};",
    'TYPESUF-Doppelbelegung')
engine = sub1(engine,
    "return nameIn(keyPc+d[0],keyPc)+(TYPESUF[d[1]]!==undefined?TYPESUF[d[1]]:d[1]);",
    "return nameIn(keyPc+d[0],keyPc)+(BLUESSUF[d[1]]!==undefined?BLUESSUF[d[1]]:d[1]);",
    'degToken')

# --- 3b Zustandszeichen vereinheitlichen ---------------------------------
# Der gefuellte Punkt stand auf AUS-Schaltern, das Haken auf AN. Das Zeichen
# vor dem Text ist die einzige Zustandsanzeige, die ohne Farbwahrnehmung
# traegt - sie muss in eine Richtung zeigen: gefuellt = an, offen = aus.
for old, new_ in [
    ("this.innerHTML=on?'&#10022; INFINITY ON':'&#9679; INFINITY OFF';",
     "this.innerHTML=on?'&#9679; INFINITY AN':'&#9675; INFINITY AUS';"),
    ("this.innerHTML=on?'&#10003; CLOCK AN':'&#9679; CLOCK OFF';",
     "this.innerHTML=on?'&#9679; CLOCK AN':'&#9675; CLOCK AUS';"),
    ("this.innerHTML=ext.on?'&#10003; SLAVE AN':'&#9679; SLAVE OFF';",
     "this.innerHTML=ext.on?'&#9679; SLAVE AN':'&#9675; SLAVE AUS';"),
    ("sb.classList.add('on'); sb.innerHTML='&#10003; SLAVE AN';",
     "sb.classList.add('on'); sb.innerHTML='&#9679; SLAVE AN';"),
    ("tg.classList.add('on'); tg.innerHTML='&#10003; CLOCK AN';",
     "tg.classList.add('on'); tg.innerHTML='&#9679; CLOCK AN';"),
    ("this.innerHTML=on?'&#10003; Tempo/Swing \u00fcbernehmen':'&#9679; Tempo/Swing \u00fcbernehmen';",
     "this.innerHTML=(on?'&#9679;':'&#9675;')+' Tempo/Swing \u00fcbernehmen';"),
    ("document.getElementById('bandTempo').innerHTML='&#10003; Tempo/Swing \u00fcbernehmen';",
     "document.getElementById('bandTempo').innerHTML='&#9679; Tempo/Swing \u00fcbernehmen';"),
    # Ein Schalter, dessen Beschriftung wechselt, ist keiner.
    ("this.innerHTML=on?'&#9679; Septakkorde':'&#9675; Dreikl\u00e4nge';",
     "this.innerHTML=(on?'&#9679;':'&#9675;')+' Septakkorde';"),
    # Die Karte heisst "Takte", die Kacheln darin hiessen "Bar".
    ('<div class="bn">Bar \'+bar+', '<div class="bn">Takt \'+bar+'),
]:
    engine = sub1(engine, old, new_, 'Zustandszeichen: ' + old[:40])

# --- 3c Performance: Tick-Quelle in einen Worker --------------------------
# Chrome drosselt setInterval in Hintergrund-Tabs auf >= 1 s - genau dann,
# wenn Cubase den Fokus hat. Der 20-ms-Tick zieht deshalb in einen Worker;
# Worker-Timer sind von der Drosselung ausgenommen. Zusaetzlich waechst der
# Lookahead im Hintergrund (Stop/Tempo sind Vordergrund-Aktionen, dort bleibt
# er kurz), und die reinen Anzeige-Arbeiten (Klaviatur-Timer, Taktzaehler)
# entfallen, solange der Tab nicht sichtbar ist.
engine = sub1(engine,
    "  sched.timer=setInterval(schedTick,SCHED_TICK);",
    "  startTicker();",
    'Ticker-Start')
engine = sub1(engine,
    "  if(sched.timer){clearInterval(sched.timer);sched.timer=null;}",
    "  stopTicker();",
    'Ticker-Stop')
engine = sub1(engine,
    "var SCHED_TICK=20, LOOKAHEAD=220;",
    """var SCHED_TICK=20, LOOKAHEAD=220, LOOKAHEAD_FG=220, LOOKAHEAD_BG=600;
/* Tick-Quelle im Worker: Chrome drosselt setInterval in Hintergrund-Tabs auf
   >=1 s - genau dann, wenn die DAW den Fokus hat. Worker-Timer sind davon
   ausgenommen. Faellt die Worker-Erzeugung aus, greift setInterval als
   Rueckfallebene. */
var tickWorker=(function(){
  try{
    var s='var t=null;onmessage=function(e){clearInterval(t);t=null;if(e.data>0)t=setInterval(function(){postMessage(0);},e.data);};';
    return new Worker(URL.createObjectURL(new Blob([s],{type:'text/javascript'})));
  }catch(e){return null;}
})();
if(tickWorker)tickWorker.onmessage=function(){schedTick();};
try{window.__tickerMode=tickWorker?'worker':'interval';}catch(e){}
function startTicker(){
  if(tickWorker){tickWorker.postMessage(SCHED_TICK);return;}
  if(!startTicker.warned){startTicker.warned=1;log('Tick-Worker nicht verf\\u00fcgbar \\u2013 setInterval-R\\u00fcckfall (Hintergrund-Tab kann ruckeln)','w');}
  sched.timer=setInterval(schedTick,SCHED_TICK);
}
function stopTicker(){
  if(tickWorker)tickWorker.postMessage(0);
  if(sched.timer){clearInterval(sched.timer);sched.timer=null;}
}
/* Im Hintergrund groesserer Vorlauf: dort bedient niemand Stop oder Tempo,
   aber die Queue uebersteht auch zaehe Momente des Hauptthreads. */
if(document.hidden)LOOKAHEAD=LOOKAHEAD_BG;
document.addEventListener('visibilitychange',function(){
  LOOKAHEAD=document.hidden?LOOKAHEAD_BG:LOOKAHEAD_FG;
});""",
    'Worker-Ticker')
# --- 3e Cubase-Stop: Wertekonflikt Markup/Engine --------------------------
# Das neue "Bei STOP"-Select liefert 'stop'/'none'; die Engine pruefte auf
# den alten V2-Wert '1'. Ergebnis: der rote Stop-Knopf schickte NIE ein
# MMC-Stop an Cubase, nur der Sofortbefehl (force) funktionierte.
engine = sub1(engine,
    "  if(!force&&gEl('cubStop').value!=='1')return;",
    "  if(!force&&gEl('cubStop').value==='none')return;",
    'Cubase-Stop-Wert')

# --- 3d Clock-Slave: im Wartezustand nicht schedulen ----------------------
# Stand SLAVE auf AN, aber die DAW lieferte (noch) keine Clock, interpolierte
# schedTick trotzdem ab Play munter weiter - bis die 4-Sekunden-Resynchro-
# nisation die Zeitbasis zurueckriss: erster Takt spielt, dann Stille
# (bei 81 BPM sind 4000 ms exakt 1,35 Takte). Der Transport meldet zwar
# "wartet auf das Start-Signal der DAW", gewartet hat aber nur die Anzeige.
engine = sub1(engine,
    "  var slave=extSlaving();\n",
    "  var slave=extSlaving();\n"
    "  if(slave&&!ext.running)return;      // SLAVE wartet auf die DAW - erst das Start-Signal oeffnet den Hahn\n",
    'Slave-Wartezustand')

# Der Visual-Timer reicht zusaetzlich Lane-Nummer und Tick durch: die Huelle
# filtert damit die Klaviatur pro Lane und zeichnet die Tabulatur (MP3TAB),
# zeitgenau zum hoerbaren Note-On. Note-Off laeuft ungefiltert, damit beim
# Abschalten eines Filters keine Taste haengen bleibt.
engine = sub1(engine,
    """    (function(m,col,ch,a,b){
      visTimers.push(setTimeout(function(){litKey(m,col);flashCh(ch,col);},Math.max(0,a-performance.now())));
      visTimers.push(setTimeout(function(){litKey(m,null);},Math.max(0,b-performance.now())));
    })(e.m,L.color,L.ch,onMs,offMs);""",
    """    if(!document.hidden)(function(m,col,ch,a,b,li,t){
      visTimers.push(setTimeout(function(){litKey(m,col,li);flashCh(ch,col);if(window.MP3TAB)MP3TAB.note(m,li,t);},Math.max(0,a-performance.now())));
      visTimers.push(setTimeout(function(){litKey(m,null,li);},Math.max(0,b-performance.now())));
    })(e.m,L.color,L.ch,onMs,offMs,e.li,e.t);""",
    'Visual-Timer: nur sichtbar, mit Lane und Tick')
engine = sub1(engine,
    "  if(bi>=0&&bi<gBars.length){",
    "  if(!document.hidden&&bi>=0&&bi<gBars.length){",
    'Taktanzeige nur bei sichtbarem Tab')

# --- 4 Speicherschluessel: eigener Namensraum, MP2 bleibt unberuehrt ------
engine = engine.replace('midiperfect2.', 'midiperfect3.')

# --- 5 Hilfetexte aus MP2 uebernehmen ------------------------------------
def inner(el_id):
    m = re.search(r'<div class="hint2"[^>]*id="%s"[^>]*>(.*?)</div>\s*\n' % el_id, head, re.S)
    if not m:
        raise SystemExit('Hilfetext %s nicht gefunden' % el_id)
    return m.group(1).strip()

for hid, cls in (('hintBlues', 'hint2'), ('hintSync', 'hint2 scroll-y'), ('hintSetups', 'hint2')):
    body = sub1(body, '<div class="%s" id="%s"></div>' % (cls, hid),
                '<div class="%s" id="%s">%s</div>' % (cls, hid, inner(hid)), hid)

# --- 6 Zusammenbauen ------------------------------------------------------
out = u'''<!DOCTYPE html>
<html lang="de"><head><meta charset="UTF-8">
<title>MIDI PERFECT 3</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
%s
%s
</style></head><body>
%s
<script>
"use strict";
%s
</script>
<script>
%s
</script>
</body></html>
''' % (css, compat + '\n' + layout, body, engine, shell)

# Build-Kennung in der Seitenleiste. sub1 statt replace: faellt der Anker weg,
# bricht der Bau ab, statt still die alte Kennung auszuliefern - genau das war
# passiert (die Leiste zeigte dauerhaft "-A", egal welcher Build lief).
out = sub1(out,
    '<small id="buildTag">BUILD 2026-08-01-A</small>',
    '<small id="buildTag">%s</small>' % BUILD,
    'Build-Kennung')
io.open(DST, 'w', encoding='utf-8').write(out)

# --- 7 Abgleich: kennt die Huelle jede ID, die die Engine anspricht? ------
used = set()
for pat in (r"getElementById\(\s*'([^']+)'", r"gEl\(\s*'([^']+)'", r"suEl\(\s*'([^']+)'",
            r"suVal\(\s*'([^']+)'", r"suOn\(\s*'([^']+)'", r"suPut\(\s*'([^']+)'",
            r"suToggle\(\s*'([^']+)'", r"querySelector\(\s*'#([\w-]+)"):
    used |= set(re.findall(pat, engine))
have = set(re.findall(r'\sid="([^"]+)"', body)) | set(re.findall(r'id="([^"]+)"', engine))
dynamic = {'b', 'cblock', 'chc', 'chn', 'key', 'tbb'}
missing = sorted(x for x in used if x not in have and x not in dynamic and not re.match(r'^b\d$', x))
extra_b = [x for x in ('b0','b1','b2','b3') if x not in have]

print('Datei: %s  (%d KB)' % (DST, len(out) // 1024))
print('Engine spricht %d IDs an.' % len(used))
if missing or extra_b:
    print('FEHLEND IM MARKUP: %s' % ', '.join(missing + extra_b))
    sys.exit(1)
print('ID-Abgleich: vollstaendig.')
