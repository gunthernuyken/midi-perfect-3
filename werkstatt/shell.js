/* ============================================================
   12 · HÜLLE — Seitenleiste, Ansichten, Dock

   Die Engine darüber ist unverändert aus MIDI PERFECT 2 übernommen. Diese
   Schicht ordnet sie nur neu an: sie zeigt genau eine Ansicht, hält den
   Transport permanent sichtbar und gleicht die drei Tonart-Auswahlfelder
   gegeneinander ab. Sie greift nie in die Erzeugung von Noten ein.
   ============================================================ */
(function(){
"use strict";
var LS_UI='midiperfect3.ui.v1';
var VIEWS=['midi','song','blues','lanes','sync','export','monitor'];
function el(id){return document.getElementById(id);}
function ui(){try{return JSON.parse(localStorage.getItem(LS_UI)||'{}')||{};}catch(e){return {};}}
function saveUi(o){try{localStorage.setItem(LS_UI,JSON.stringify(o));}catch(e){}}

/* --- Ansichtswechsel ---------------------------------------------------
   Das Protokoll gibt es genau einmal im Dokument. Statt es zu doppeln und
   zwei Stände synchron halten zu müssen, wandert das eine Element in den
   Platzhalter der sichtbaren Ansicht. Die Engine schreibt weiter stur nach
   #log und merkt von alles nichts. */
function placeLog(view){
  var log=el('log'); if(!log)return;
  var slot=document.querySelector('#view'+view.charAt(0).toUpperCase()+view.slice(1)+' .log-slot');
  if(slot&&log.parentNode!==slot)slot.appendChild(log);
}
var curView='';
function showView(v,quiet){
  if(VIEWS.indexOf(v)<0)v='midi';
  if(v===curView)return;
  curView=v;
  VIEWS.forEach(function(n){
    var sec=el('view'+n.charAt(0).toUpperCase()+n.slice(1));
    if(sec)sec.hidden=(n!==v);
  });
  var items=document.querySelectorAll('.rail-item');
  for(var i=0;i<items.length;i++){
    var on=items[i].getAttribute('data-view')===v;
    if(on)items[i].setAttribute('aria-current','page'); else items[i].removeAttribute('aria-current');
  }
  placeLog(v);
  var c=document.querySelector('.content'); if(c)c.scrollTop=0;
  if(!quiet){var o=ui();o.view=v;saveUi(o);}
  try{history.replaceState(null,'','#'+v);}catch(e){}
}
document.querySelector('.rail').addEventListener('click',function(e){
  var b=e.target.closest?e.target.closest('.rail-item'):null;
  if(b)showView(b.getAttribute('data-view'));
});

/* Alt/Option + 1-7 wechselt den Bereich. Die blanken Ziffern bleiben
   bewusst bei den Lanes — das ist eingeübt und wird beim Spielen gebraucht. */
document.addEventListener('keydown',function(e){
  if(!e.altKey||e.metaKey||e.ctrlKey)return;
  var m=/^Digit([1-7])$/.exec(e.code); if(!m)return;
  e.preventDefault(); showView(VIEWS[parseInt(m[1],10)-1]);
},true);

/* --- Seitenleiste einklappen ------------------------------------------ */
var railTgl=document.querySelector('.rail-toggle');
railTgl.addEventListener('click',function(){
  var open=this.getAttribute('aria-expanded')!=='false';
  this.setAttribute('aria-expanded',open?'false':'true');
  this.innerHTML=(open?'&#9656;':'&#9666;')+'&nbsp;<span class="label">Leiste</span>';
  var o=ui();o.rail=!open;saveUi(o);
});

/* --- Klaviatur-Dock --------------------------------------------------- */
var pianoTgl=document.querySelector('.piano-toggle');
pianoTgl.addEventListener('click',function(){
  var open=this.getAttribute('aria-expanded')!=='false';
  this.setAttribute('aria-expanded',open?'false':'true');
  this.textContent=open?'Ausklappen':'Einklappen';
  var o=ui();o.piano=!open;saveUi(o);
});

/* --- Regler: gefüllter Bahnanteil -------------------------------------
   Der Bestand hat die Bahn einfarbig gelassen. Der gefüllte Anteil zeigt den
   Wert auch dann, wenn die Zahl daneben gerade nicht im Blick ist. */
function setFill(r){
  var min=parseFloat(r.min||0), max=parseFloat(r.max||100), v=parseFloat(r.value||0);
  r.style.setProperty('--fill',(max>min?((v-min)/(max-min)*100):0)+'%');
}
function allFills(){
  var rs=document.querySelectorAll('input[type=range]');
  for(var i=0;i<rs.length;i++)setFill(rs[i]);
}
document.addEventListener('input',function(e){
  if(e.target&&e.target.type==='range')setFill(e.target);
},true);

/* --- Zustand der Schalter für Hilfstechnik lesbar machen ---------------
   Die Engine schaltet .on. Screenreader lesen Klassen nicht; aria-pressed
   wird deshalb nachgezogen, statt 40 Handler anzufassen. */
function syncPressed(root){
  var c=(root||document).querySelectorAll('.chip,.tgl,.tbl');
  for(var i=0;i<c.length;i++)c[i].setAttribute('aria-pressed',c[i].classList.contains('on')?'true':'false');
  armChips(root);
}
/* Die Engine erzeugt ihre Lane-Schalter als <span>. Ein span nimmt weder
   Fokus noch aria-pressed an: mit der Tastatur waren SOLO und die
   Lane-Sperre schlicht nicht erreichbar. Statt buildLanes umzubauen werden
   sie hier nachgerüstet. */
function armChips(root){
  var c=(root||document).querySelectorAll('.chip:not([data-armed]),.cb:not([data-armed])');
  for(var i=0;i<c.length;i++){
    var e=c[i];
    e.setAttribute('data-armed','1');
    if(e.tagName==='BUTTON')continue;
    e.setAttribute('role',e.classList.contains('cb')?'button':'switch');
    e.setAttribute('tabindex','0');
    e.addEventListener('keydown',function(ev){
      if(ev.key===' '||ev.key==='Enter'){ev.preventDefault();this.click();}
    });
  }
}
new MutationObserver(function(ms){
  for(var i=0;i<ms.length;i++){
    var t=ms[i].target;
    if(t.nodeType===1&&(t.classList.contains('chip')||t.classList.contains('tgl')||t.classList.contains('tbl')))
      t.setAttribute('aria-pressed',t.classList.contains('on')?'true':'false');
    if(ms[i].type==='childList')syncPressed(t.nodeType===1?t:document);
  }
}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});

/* --- Läuft der Transport? Für den Leuchtstreifen der Kommandoleiste ---- */
var appEl=document.querySelector('.app'), stopBtn=el('btnStop');
new MutationObserver(function(){
  appEl.setAttribute('data-playing',stopBtn.disabled?'false':'true');
}).observe(stopBtn,{attributes:true,attributeFilter:['disabled']});

/* --- Eine Tonart statt drei -------------------------------------------
   keyPc (Song), blKey (Blues-Form) und blTo (Transpositionsziel) meinten
   in MIDI PERFECT 2 dasselbe, liefen aber auseinander, sobald man eines
   davon anfasste. Sie werden jetzt aneinander gebunden: wer eines ändert,
   ändert alle. Die Engine schreibt weiterhin in alle drei und bleibt
   dadurch unberührt. */
var keySync=false;
function bindKeys(){
  ['keyPc','blKey','blTo'].forEach(function(id){
    var e=el(id); if(!e)return;
    e.addEventListener('change',function(){
      if(keySync)return;
      keySync=true;
      var v=this.value;
      ['keyPc','blKey','blTo'].forEach(function(o){
        var t=el(o);
        if(t&&t!==e&&t.value!==v){t.value=v;t.dispatchEvent(new Event('change',{bubbles:true}));}
      });
      keySync=false;
    });
  });
}

/* --- Übersetzungen der neuen Hülle ------------------------------------ */
function addI18n(){
  if(typeof I18N!=='object')return;
  I18N_PAT.push([/^Takt (\d+)$/,'Bar $1']);
  I18N_PAT.push([/^Takt (\d+)-(\d+)$/,'Bars $1-$2']);
  var add={
   '\u25cf CLOCK AN':'\u25cf CLOCK ON','\u25cb CLOCK AUS':'\u25cb CLOCK OFF',
   '\u25cf SLAVE AN':'\u25cf SLAVE ON','\u25cb SLAVE AUS':'\u25cb SLAVE OFF',
   '\u25cb INFINITY AUS':'\u25cb INFINITY OFF',
   '\u25cf Tempo/Swing \u00fcbernehmen':'\u25cf Adopt tempo/swing',
   '\u25cb Tempo/Swing \u00fcbernehmen':'\u25cb Adopt tempo/swing',
   'Takte pro Akkord':'Bars per chord','Standard-Typ':'Default type',
   '\u00dcbernehmen':'Apply','\u21ba R\u00fcckg\u00e4ngig':'\u21ba Undo',
   'Initialisiere\u2026':'Initialising\u2026',
   'MIDI & Transport':'MIDI & transport','Song':'Song','Blues-Werkstatt':'Blues workshop',
   'Lanes':'Lanes','Sync':'Sync','Export & Setups':'Export & setups','Monitor':'Monitor',
   'Bereiche':'Sections','Seitenleiste ein-/ausklappen':'Collapse / expand the sidebar',
   'Leiste':'Rail','Einklappen':'Collapse','Ausklappen':'Expand',
   'Klaviatur · Farbe = Lane':'Keyboard · colour = lane',
   'Eine Cubase-Spur pro Kanal':'One Cubase track per channel',
   'Vollständig unter Monitor':'Full version under Monitor',
   '→ ab Startkanal verteilen':'→ spread from start channel',
   'Bei jedem Durchlauf werden nicht gesperrte Takte neu gewürfelt. Die Akkorde bleiben, die Ausführung ändert sich.':
     'Every pass rerolls the unlocked bars. The chords stay, the performance changes.',
   'Erweitert':'Advanced','Progression':'Progression','Takte':'Bars','Tonart':'Key','Form':'Form',
   'Turnaround':'Turnaround','Groove':'Groove','Transposition':'Transposition',
   'Tonart folgt dem Song':'Key follows the song',
   'Tempofelder':'Tempo fields','Chorus-Bogen':'Chorus arc','Band-Presets':'Band presets',
   'Band-Preset':'Band preset','Clock & Slave':'Clock & slave','Cubase':'Cubase',
   'Sofortbefehle':'Instant commands','Anleitung':'Instructions','MIDI Export':'MIDI export',
   'Diese Seite sichern':'Save this page','Setups':'Setups','Kanal-Belegung':'Channel map',
   'Protokoll':'Log','MIDI-Monitor':'MIDI monitor','Stufen':'Scale degrees',
   'Nächster Akkord':'Next chord','Reharmonisierung':'Reharmonisation','Generator':'Generator',
   'Akkordfolge':'Chord progression','Suffix-Liste':'Suffix list',
   'Klick = sperren · gesperrte Takte mutieren nicht':'Click = lock · locked bars do not mutate',
   'Leerzeichen trennt · :n = Takte':'Space separates · :n = bars',
   'Aus dem letzten Akkord abgeleitet':'Derived from the last chord',
   'Nochmal klicken = nächste Stufe im Bereich':'Click again = next step inside the range',
   'Rahmenfarbe = Lane · Aufblitzen = Note gesendet':'Border colour = lane · flash = note sent',
   'Nur wenn eingeschaltet':'Only when switched on',
   'Setzt Style, Lane-On/Off und optional Tempo':'Sets style, lane on/off and optionally tempo',
   'Hinweise zu Swing und Chorus':'Notes on swing and chorus',
   'Was ein Setup enthält':'What a setup contains',
   'Sichert die Anwendung mitsamt ihrem aktuellen Zustand als eigenständige Datei.':
     'Saves the application together with its current state as a standalone file.',
   'Aktuellen Stand als Setup speichern (Cmd/Strg+S)':'Save the current state as a setup (Cmd/Ctrl+S)',
   'Alle nicht gesperrten Lanes neu würfeln (R)':'Reroll every unlocked lane (R)'
  };
  for(var k in add)if(!I18N[k])I18N[k]=add[k];
}

/* --- Start ------------------------------------------------------------- */
function boot(){
  var o=ui();
  if(o.rail===false){railTgl.setAttribute('aria-expanded','false');railTgl.innerHTML='&#9656;&nbsp;<span class="label">Leiste</span>';}
  if(o.piano===false){pianoTgl.setAttribute('aria-expanded','false');pianoTgl.textContent='Ausklappen';}
  var start=(location.hash||'').replace('#','');
  showView(VIEWS.indexOf(start)>=0?start:(o.view||'midi'),true);
  allFills(); syncPressed(); bindKeys(); addI18n();
  appEl.setAttribute('data-playing',stopBtn.disabled?'false':'true');
}
boot();
window.MP3={showView:showView,setFill:setFill};
})();
