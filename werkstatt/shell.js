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
   'Tabulatur · aktueller Takt':'Tablature · current bar',
   'Lanes in der Klaviatur':'Lanes on the keyboard',
   'Lanes in der Tabulatur':'Lanes in the tablature',
   'Tabulatur des laufenden Takts':'Tablature of the current bar',
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

/* --- Klaviatur- und Tab-Filter, Tabulatur ------------------------------
   Beide Anzeigen bekommen fünf Lane-Schalter. Sie filtern nur die ANZEIGE —
   was klingt, entscheidet weiterhin allein der Lane-Schalter im Transport.
   Die Tabulatur zeichnet den laufenden Takt als 6 × 16tel-Raster; beim
   Taktwechsel wird geleert. Die Engine liefert die Ereignisse über den
   MP3TAB-Haken im Scheduler, zeitgenau zum hörbaren Note-On. */
var pianoOn=[1,1,1,1,1], tabOn=[0,1,1,1,1];      // Drums im Tab per Default aus
var TABSTR=[64,59,55,50,45,40], TABNAM=['e','B','G','D','A','E'], LANEAB=['Dr','Ba','Ch','Ar','Me'];
var TABBARS=8, TABCPB=8;                          // 8 Takte, Achtel-Raster
function buildTab(){
  var t=el('tab'); if(!t)return; var h='',n=TABBARS*TABCPB;
  for(var s=0;s<6;s++){
    h+='<span class="ts">'+TABNAM[s]+'</span>';
    for(var c=0;c<n;c++)h+='<span class="tc'+(c%TABCPB===0?' tbar':(c%2===0?' tbeat':''))+'" id="tab-'+s+'-'+c+'"></span>';
  }
  h+='<div class="tab-cur" aria-hidden="true"></div>';
  h+='<div class="tab-play" id="tabPlay" aria-hidden="true"></div>';
  t.innerHTML=h;
}
function clearTab(){
  var cs=document.querySelectorAll('#tab .tc.has');
  for(var i=0;i<cs.length;i++){cs[i].innerHTML='';cs[i].classList.remove('has');}
}
function tabPut(s,c,txt,li){
  var e2=el('tab-'+s+'-'+c); if(!e2)return;
  var b=document.createElement('b');
  b.textContent=txt; b.style.color=window.LANES[li].color;
  e2.appendChild(b); e2.classList.add('has');
}
var tabWin=-1, tabBar=-1, tabMode='win';
/* Zwei Modi: 'win' fuellt das 8-Takte-Fenster, 'scroll' schiebt pro Takt nach
   links (laufender Takt fest in der Mitte). Beide zeichnen eine VORSCHAU aus
   den bereits generierten Loop-Events (sched.ev): kommende Noten stehen
   gedimmt im Raster und werden beim echten Note-On fest. Geplantes, das nicht
   gespielt wird (Lane aus), bleibt gedimmt stehen. */
function tabShift(){
  var n=TABBARS*TABCPB;
  for(var s=0;s<6;s++)for(var c=0;c<n;c++){
    var src=(c+TABCPB<n)?el('tab-'+s+'-'+(c+TABCPB)):null;
    var dst=el('tab-'+s+'-'+c); if(!dst)continue;
    if(src&&src.childElementCount){dst.innerHTML=src.innerHTML;dst.classList.add('has');}
    else if(dst.childElementCount){dst.innerHTML='';dst.classList.remove('has');}
  }
}
function tabWipe(c0,c1){
  for(var s=0;s<6;s++)for(var c=c0;c<c1;c++){
    var e2=el('tab-'+s+'-'+c);
    if(e2&&e2.childElementCount){e2.innerHTML='';e2.classList.remove('has');}
  }
}
function tabPut(s,c,txt,li,pre){
  var e2=el('tab-'+s+'-'+c); if(!e2)return;
  var b=document.createElement('b');
  b.textContent=txt; b.style.color=window.LANES[li].color;
  b.setAttribute('data-li',li); if(pre)b.className='pre';
  e2.appendChild(b); e2.classList.add('has');
}
/* Saitenwahl: kleinster Bund, freie Saite bevorzugt; liefert [fret,string]. */
function tabMap(m,col){
  var n=m; while(n<40)n+=12; while(n>79)n-=12;
  var cand=[];
  for(var s=0;s<6;s++){var f=n-TABSTR[s];if(f>=0&&f<=15)cand.push([f,s]);}
  if(!cand.length)return null;
  cand.sort(function(a,b){return a[0]-b[0];});
  for(var i=0;i<cand.length;i++){
    var c2=el('tab-'+cand[i][1]+'-'+col);
    if(c2&&!c2.childElementCount)return cand[i];
  }
  var best=el('tab-'+cand[0][1]+'-'+col);
  return (best&&best.childElementCount<3)?cand[0]:null;
}
function tabDraw(m,li,col,pre){
  if(li===0){
    var dd=el('tab-5-'+col);
    if(dd&&dd.childElementCount<3)tabPut(5,col,'\u00d7',li,pre);
    return;
  }
  var hit=tabMap(m,col);
  if(hit)tabPut(hit[1],col,String(hit[0]),li,pre);
}
/* Beim echten Note-On die gedimmte Vorschau-Zahl fest machen. */
function tabLive(m,li,col){
  var txt=(li===0)?'\u00d7':null;
  if(txt===null){
    var n=m; while(n<40)n+=12; while(n>79)n-=12;
    // Text unbekannt (Saitenwahl haengt von Belegung ab): ueber alle Saiten suchen
    for(var s=0;s<6;s++){
      var f=n-TABSTR[s]; if(f<0||f>15)continue;
      var e2=el('tab-'+s+'-'+col); if(!e2)continue;
      var bs=e2.children;
      for(var j=0;j<bs.length;j++)
        if(bs[j].className==='pre'&&bs[j].getAttribute('data-li')==String(li)&&bs[j].textContent===String(f)){bs[j].className='';return true;}
    }
    return false;
  }
  var e3=el('tab-5-'+col); if(!e3)return false;
  var ds=e3.children;
  for(var k=0;k<ds.length;k++)
    if(ds[k].className==='pre'&&ds[k].getAttribute('data-li')==String(li)){ds[k].className='';return true;}
  return false;
}
/* Vorschau: Takte startBar..startBar+nBars-1 gedimmt in Bloecke ab blockStart.
   Der Bereich wird vorher gewischt. Am Loop-Ende laeuft die Vorschau in den
   Anfang des Takes weiter (naechster Chorus, Naeherung vor Mutation). */
function tabPreview(startBar,blockStart,nBars){
  tabWipe(blockStart*TABCPB,TABBARS*TABCPB);
  var sc=window.sched, ev=sc&&sc.ev; if(!ev||!ev.length)return;
  var BARt=window.BAR||1920;
  var loopBars=sc.loopTicks?Math.max(1,Math.round(sc.loopTicks/BARt)):0;
  for(var i=0;i<ev.length;i++){
    var e=ev[i], li=e.li;
    if(!tabOn[li])continue;
    var L=window.LANES[li]; if(!L||!L.on)continue;
    var bar=Math.floor(e.t/BARt), rel=bar-startBar;
    if(loopBars&&rel<0)rel+=loopBars;
    if(rel<0||rel>=nBars)continue;
    var sub=Math.min(TABCPB-1,Math.floor((e.t-bar*BARt)/(BARt/TABCPB)));
    tabDraw(e.m,li,(blockStart+rel)*TABCPB+sub,true);
  }
}
/* Playhead: laufende Linie an der aktuellen Scheduler-Position. Die Zeit
   kommt aus sched (tickRef/msRef) - dieselbe Interpolation wie schedTick,
   auch im Clock-Slave-Betrieb gueltig. Nur Anzeige, ein Style-Write pro
   Frame, pausiert bei verstecktem Tab von selbst (rAF). */
/* Die Schleife treibt auch den TAKTWECHSEL: er passiert exakt an der
   Taktgrenze, nicht erst beim ersten Note-On des neuen Takts (der kann auf
   Schlag 2 oder spaeter liegen). Beim Transport-Neustart wird das Raster
   zurueckgesetzt statt weiterzuscrollen. */
(function(){
  var prevOn=false;
  function loop(){
    var ph=el('tabPlay'), sc=window.sched, on=!!(sc&&sc.on);
    if(on&&!prevOn){tabBar=-1;tabWin=-1;clearTab();}
    prevOn=on;
    var p=null;
    var waiting=(typeof window.extSlaving==='function')&&extSlaving()&&window.ext&&!window.ext.running;
    if(on&&!waiting&&!document.hidden&&typeof window.curMpt==='function'){
      var mpt=curMpt();
      if(mpt){
        var t=sc.tickRef+(performance.now()-sc.msRef)/mpt;
        if(t>=0){
          var BARt=window.BAR||1920;
          var bar=Math.floor(t/BARt), frac=(t-bar*BARt)/BARt;
          if(bar!==tabBar)tabEnterBar(bar);
          p=(tabMode==='scroll')?4+frac:(bar%TABBARS)+frac;
        }
      }
    }
    if(ph){
      if(p==null)ph.style.opacity='0';
      else{ph.style.opacity='1';ph.style.setProperty('--pos',p);}
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
window.MP3TAB={
  refresh:function(){ if(tabBar>=0)tabEnterBar(tabBar,true); },
  note:function(m,li,t){
    if(!tabOn[li]||t<0)return;
    var BARt=window.BAR||1920;
    var bar=Math.floor(t/BARt);
    var sub=Math.min(TABCPB-1,Math.floor((t-bar*BARt)/(BARt/TABCPB)));
    if(bar!==tabBar)tabEnterBar(bar);
    var col=(tabMode==='scroll')
      ? 4*TABCPB+sub
      : (bar%TABBARS)*TABCPB+sub;
    if(tabLive(m,li,col))return;                  // Vorschau-Zahl fest machen
    tabDraw(m,li,col,false);                      // sonst regulaer setzen
  }
};
/* Taktwechsel: Fenster-Modus leert am Fensterrand und zeichnet die Vorschau
   des ganzen Fensters; Scroll-Modus schiebt und zeichnet Mitte + Zukunft neu. */
function tabEnterBar(bar,force){
  var tt=el('tab');
  if(tabMode==='scroll'){
    if(tabBar>=0&&!force){
      var d=bar-tabBar, n=(d>0)?Math.min(d,TABBARS):1;
      for(var k=0;k<n;k++)tabShift();
    }
    tabBar=bar;
    if(tt)tt.style.setProperty('--bar',4);
    tabPreview(bar,4,4);
  }else{
    var win=Math.floor(bar/TABBARS);
    tabBar=bar;
    if(win!==tabWin||force){tabWin=win;clearTab();tabPreview(win*TABBARS,0,TABBARS);}
    if(tt)tt.style.setProperty('--bar',bar%TABBARS);
  }
}
function setTabMode(m,quiet){
  tabMode=(m==='scroll')?'scroll':'win';
  var b=el('tabModeTgl');
  if(b){
    b.textContent=tabMode==='scroll'?'\u21c4 Scroll':'\u25a6 Fenster';
    b.setAttribute('aria-pressed',tabMode==='scroll'?'true':'false');
  }
  clearTab(); var keep=tabBar; tabBar=-1; tabWin=-1;
  var tt=el('tab'); if(tt)tt.style.setProperty('--bar',tabMode==='scroll'?4:0);
  if(keep>=0)tabEnterBar(keep,true);
  if(!quiet){var o=ui();o.tabMode=tabMode;saveUi(o);}
}
/* Klaviatur-Filter: litKey wird umhüllt statt die Engine anzufassen. Der
   Scheduler reicht die Lane-Nummer als drittes Argument durch; Aufrufe ohne
   Lane (Test-Knöpfe) leuchten immer. Note-Off läuft ungefiltert, damit beim
   Abschalten eines Filters keine Taste hängen bleibt. */
var engineLit=window.litKey;
window.litKey=function(m,col,li){
  if(col&&typeof li==='number'&&!pianoOn[li])return;
  engineLit(m,col);
};
function buildVisChips(boxId,state,key){
  var box=el(boxId); if(!box)return; var h='';
  for(var i=0;i<5;i++)
    h+='<button class="vis-chip" data-i="'+i+'" style="--lane:'+window.LANES[i].color+'" aria-pressed="'+(state[i]?'true':'false')+'" title="'+window.LANES[i].name+'">'+LANEAB[i]+'</button>';
  box.innerHTML=h;
  box.addEventListener('click',function(e){
    var b=e.target.closest?e.target.closest('.vis-chip'):null; if(!b)return;
    var i=parseInt(b.getAttribute('data-i'),10);
    state[i]=state[i]?0:1;
    b.setAttribute('aria-pressed',state[i]?'true':'false');
    var o=ui(); o[key]=state.slice(); saveUi(o);
    if(key==='tabLanes'&&window.MP3TAB)MP3TAB.refresh();
  });
}

/* --- Setup-Schnellzugriff in der Transportleiste -----------------------
   Der Speichern-Knopf der Engine arbeitete stumm (nur eine Log-Zeile, die
   im gerade sichtbaren Bereich selten steht) und Laden gab es nur im
   Bereich Export & Setups. Hier: sichtbare Bestaetigung am Knopf und ein
   Lade-Menue direkt an der Leiste. Engine-Funktionen werden nur GENUTZT
   (readSetups/loadSetupByName), nicht veraendert. */
function flashBtn(b,txt){
  if(b.dataset.flash)return;
  b.dataset.flash='1';
  var o=b.innerHTML; b.innerHTML=txt;
  setTimeout(function(){b.innerHTML=o;delete b.dataset.flash;},1400);
}
var suQ=el('btnSuQuick');
if(suQ)suQ.addEventListener('click',function(){flashBtn(suQ,'\u2713 Gespeichert');});
document.addEventListener('keydown',function(e){
  if((e.metaKey||e.ctrlKey)&&(e.key==='s'||e.key==='S')&&suQ)flashBtn(suQ,'\u2713 Gespeichert');
},true);
var suL=el('btnSuQuickLoad'), suMenu=null;
function closeSuMenu(){
  if(!suMenu)return;
  suMenu.remove(); suMenu=null;
  document.removeEventListener('click',suMenuDoc,true);
  if(suL)suL.setAttribute('aria-expanded','false');
}
function suMenuDoc(e){ if(suMenu&&!suMenu.contains(e.target)&&e.target!==suL)closeSuMenu(); }
if(suL)suL.addEventListener('click',function(){
  if(suMenu){closeSuMenu();return;}
  var names=[];
  try{names=Object.keys(window.readSetups()||{}).sort();}catch(e){}
  suMenu=document.createElement('div');
  suMenu.className='su-menu';
  suMenu.setAttribute('role','menu');
  if(!names.length){
    suMenu.innerHTML='<span class="su-empty">Noch kein Setup gespeichert \u2013 erst \u{1F4BE} Setup dr\u00fccken</span>';
  }else{
    names.forEach(function(n){
      var b=document.createElement('button');
      b.type='button'; b.setAttribute('role','menuitem'); b.textContent=n;
      b.addEventListener('click',function(){
        closeSuMenu();
        if(window.loadSetupByName(n))flashBtn(suL,'\u2713 Geladen');
      });
      suMenu.appendChild(b);
    });
  }
  var r=suL.getBoundingClientRect();
  suMenu.style.insetInlineEnd=(window.innerWidth-r.right)+'px';
  suMenu.style.insetBlockStart=(r.bottom+4)+'px';
  document.body.appendChild(suMenu);
  suL.setAttribute('aria-expanded','true');
  document.addEventListener('click',suMenuDoc,true);
});

/* --- Start ------------------------------------------------------------- */
function boot(){
  var o=ui();
  if(o.rail===false){railTgl.setAttribute('aria-expanded','false');railTgl.innerHTML='&#9656;&nbsp;<span class="label">Leiste</span>';}
  if(o.piano===false){pianoTgl.setAttribute('aria-expanded','false');pianoTgl.textContent='Ausklappen';}
  if(o.pianoLanes&&o.pianoLanes.length===5)pianoOn=o.pianoLanes.map(function(x){return x?1:0;});
  if(o.tabLanes&&o.tabLanes.length===5)tabOn=o.tabLanes.map(function(x){return x?1:0;});
  var start=(location.hash||'').replace('#','');
  showView(VIEWS.indexOf(start)>=0?start:(o.view||'midi'),true);
  allFills(); syncPressed(); bindKeys(); addI18n();
  buildTab(); buildVisChips('pianoChips',pianoOn,'pianoLanes'); buildVisChips('tabChips',tabOn,'tabLanes');
  var mt=el('tabModeTgl');
  if(mt)mt.addEventListener('click',function(){setTabMode(tabMode==='scroll'?'win':'scroll');});
  setTabMode(o.tabMode||'win',true);
  appEl.setAttribute('data-playing',stopBtn.disabled?'false':'true');
}
boot();
window.MP3={showView:showView,setFill:setFill};
})();
