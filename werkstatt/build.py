# -*- coding: utf-8 -*-
"""Baut MIDI PERFECT 3 aus der Engine von MIDI PERFECT 2 und der neuen Hülle.

Die Engine wird NICHT umgeschrieben. Entfernt werden nur die Teile, die es in
der neuen Hülle nicht mehr gibt: die zweite Transportleiste samt ihrer
Abgleichschleife und die Klapp-Panel-Logik, die der Router ersetzt.
"""
import io, re, sys

MP2   = '/tmp/out/MIDI PERFECT 2.html'
DST   = '/tmp/mp3/MIDI PERFECT 3.html'
BUILD = 'BUILD 2026-08-01-A'

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

out = out.replace('BUILD 2026-08-01-A &middot; Setup-Speicher &middot; Arrangement-Bogen &middot; Zweisprachig DE/EN', BUILD)
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
