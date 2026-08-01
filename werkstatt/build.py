# -*- coding: utf-8 -*-
"""Baut MIDI PERFECT 4 aus den Werkstatt-Quellen.

Seit dem Versionsschnitt ist die Engine eine ECHTE QUELLDATEI (engine.js):
einmalig aus MIDI PERFECT 2 extrahiert, alle bis dahin per Anker-Ersetzung
gepflegten Korrekturen (Builds A-Q der Version 3) sind eingearbeitet.
Grund: die Taktarten-Arbeit (METER-ANALYSE.md, ~270 Stellen) ist per
Anker-Patch nicht mehr wartbar. MIDI PERFECT 2 wird zum Bauen nicht mehr
gebraucht; der ID-Abgleich bleibt.
"""
import io, re, sys

VER   = '4'
DST   = '/tmp/mp3/MIDI PERFECT %s.html' % VER
BUILD = 'BUILD 2026-08-01-C'

engine= io.open('/tmp/mp3/engine.js', encoding='utf-8').read()
css   = io.open('/tmp/design/mp3.css', encoding='utf-8').read()
compat= io.open('/tmp/mp3/compat.css', encoding='utf-8').read()
layout= io.open('/tmp/mp3/layout.css', encoding='utf-8').read()
body  = io.open('/tmp/mp3/body.html', encoding='utf-8').read()
shell = io.open('/tmp/mp3/shell.js', encoding='utf-8').read()

def sub1(text, old, new, what):
    if text.count(old) != 1:
        raise SystemExit('%s: %d Treffer statt 1 fuer %r' % (what, text.count(old), old[:70]))
    return text.replace(old, new)

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
%s</script>
<script>
%s
</script>
</body></html>
''' % (css, compat + '\n' + layout, body, engine, shell)

# Build-Kennung: sub1 statt replace - fehlt der Anker, bricht der Bau ab.
out = sub1(out,
    '<small id="buildTag">BUILD 2026-08-01-A</small>',
    '<small id="buildTag">%s</small>' % BUILD,
    'Build-Kennung')

# Versionsname und Speicher-Namensraum. engine.js und body.html sind bereits
# auf Version 4; die Ersetzungen greifen nur noch fuer shell.js und den Titel.
if VER != '3':
    out = out.replace('MIDI PERFECT&nbsp;3', 'MIDI PERFECT&nbsp;' + VER)
    out = out.replace('MIDI PERFECT 3', 'MIDI PERFECT ' + VER)
    out = out.replace('midiperfect3.', 'midiperfect' + VER + '.')

io.open(DST, 'w', encoding='utf-8').write(out)

# --- Abgleich: kennt die Huelle jede ID, die die Engine anspricht? --------
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
