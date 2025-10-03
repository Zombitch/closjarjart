let blockedRanges = getBlockedDateRanges();

// ======= OUTILS DE DATES =======
const MS_DAY = 24*60*60*1000;
const toISO = d => d.toISOString();
const fromISO = iso => { return new Date(iso); };
const frFormat = d => d ? String(d.getDate()).padStart(2,'0') + '/' + String(d.getMonth()+1).padStart(2,'0') + '/' + d.getFullYear() : '';
const atMidnight = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const cmpDate = (a,b) => atMidnight(a) - atMidnight(b);

function inRange(d, a, b){ const x=+(d), A=+(a), B=+(b); return x>=Math.min(A,B) && x<=Math.max(A,B); }
function* daysBetween(a,b){ const start=a, end=b; for(let t=+start; t<=+end; t+=MS_DAY){ yield new Date(t); } }

// Prépare les ensembles pour recherches rapides
let blockedRangeObjs = blockedRanges.map(([a,b,c,d,e])=>[fromISO(a), fromISO(b), c, d,e]);

function getRangeData(checkDate){ 
  let reservation = [];
  for(const [a,b,c,d,e] of blockedRangeObjs){ 
    if(inRange(checkDate, atMidnight(a),b)){
      reservation.push({
        startDate: a,
        endDate: b,
        id: c,
        isConfirmed: d,
        type: e});
    }
  }
  return reservation;
}

function updateBlockedDateRange(dateRange){
    blockedRanges = dateRange;
    blockedRangeObjs = blockedRanges.map(([a,b])=>[fromISO(a), fromISO(b)]);
}

function isBlocked(d){
  const iso = toISO(d);
  for(const [a,b] of blockedRangeObjs){ if(inRange(d,a,b)) return true; }
  return false;
}

function isBlockedAM(d){
  const isoAtMidnight = atMidnight(fromISO(d));
  for(const [a,b] of blockedRangeObjs){ if(atMidnight(fromISO(b)).getTime() == isoAtMidnight.getTime()) return true; }
  return false;
}

function isBlockedPM(d){
  const isoAtMidnight = atMidnight(fromISO(d));
  for(const [a,b] of blockedRangeObjs){ if(atMidnight(fromISO(a)).getTime() == isoAtMidnight.getTime()) return true; }  
  return false;
}

function spanCrossesBlocked(a,b){
  for(const d of daysBetween(a,b)){ 
    if(isBlocked(d)) return true; 
  }
  return false;
}

// ======= UI ELEMENTS =======
const startInput = document.getElementById('dateStart');
const endInput   = document.getElementById('dateEnd');
const startISO   = document.getElementById('dateStartISO');
const endISO     = document.getElementById('dateEndISO');
const picker     = document.getElementById('picker');
const calWrap    = document.getElementById('cal');
const monthLabel = document.getElementById('monthLabel');
const prevBtn    = document.getElementById('prevBtn');
const nextBtn    = document.getElementById('nextBtn');
const hint       = document.getElementById('hint');

let anchorInput = null; // champ qui a ouvert le calendrier
let selectingStart = true;
let selStart = null, selEnd = null;
let viewYear, viewMonth; // 0-11

function setViewDate(d){
  viewYear = d.getFullYear();
  viewMonth = d.getMonth();
}

function openPicker(forInput){
  anchorInput = forInput;
  const rect = forInput.getBoundingClientRect();
  picker.style.left = rect.left;
  picker.style.top  = rect.bottom;
  picker.classList.remove('hidden');
  // Base sur date existante ou aujourd'hui
  const base = forInput === startInput && startISO.value ? fromISO(startISO.value)
             : forInput === endInput   && endISO.value   ? fromISO(endISO.value)
             : new Date();
  setViewDate(base);
  selectingStart = (forInput === startInput) || !(startISO.value);
  selStart = startISO.value ? fromISO(startISO.value) : null;
  selEnd   = endISO.value   ? fromISO(endISO.value)   : null;
  renderCalendar();
  document.addEventListener('keydown', onKey);
  document.addEventListener('click', onDocClick, true);
}

function closePicker(){
  picker.classList.add('hidden');
  document.removeEventListener('keydown', onKey);
  document.removeEventListener('click', onDocClick, true);
}

function onKey(e){ if(e.key==='Escape') closePicker(); }
function onDocClick(e){ if(!picker.contains(e.target) && e.target!==startInput && e.target!==endInput){ closePicker(); } }

if(startInput) startInput.addEventListener('click', ()=> openPicker(startInput));
if(endInput) endInput.addEventListener('click',   ()=> openPicker(endInput));
if(prevBtn) prevBtn.addEventListener('click', ()=> { if(--viewMonth<0){ viewMonth=11; viewYear--; } renderCalendar(); });
if(nextBtn) nextBtn.addEventListener('click', ()=> { if(++viewMonth>11){ viewMonth=0;  viewYear++; } renderCalendar(); });

function renderCalendar(){
  const first = new Date(viewYear, viewMonth, 1);
  const startWeekday = (first.getDay()+6)%7; // Lundi=0
  const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate();
  monthLabel.textContent = first.toLocaleDateString('fr-FR', { month:'long', year:'numeric' });

  calWrap.innerHTML = '';
  // padding cells
  for(let i=0;i<startWeekday;i++){ const pad = document.createElement('div'); calWrap.appendChild(pad); }

  for(let day=1; day<=daysInMonth; day++){
    const d = new Date(viewYear, viewMonth, day);
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cal-cell rounded-md text-sm px-0.5 ';

    // State classes
    const disabled = isBlocked(d) || d < new Date();
    const disabledAM = isBlockedAM(d);
    const disabledPM = isBlockedPM(d);
    const disabledAMPM = isBlockedAM(d) && isBlockedPM(d);
    const isSelStart = selStart && cmpDate(d, selStart)===0;
    const isSelEnd   = selEnd   && cmpDate(d, selEnd)===0;
    const inSelSpan  = selStart && selEnd && inRange(d, selStart, selEnd);

    let cls = 'hover:bg-blue-50';
    if(disabledAMPM){ cls = 'bg-gray-200 text-gray-400 cursor-not-allowed line-through'; }
    else if(disabledAM){ cls = 'cal-cell-blocked-am'; }
    else if(disabledPM){ cls = 'cal-cell-blocked-pm'; }
    else if(disabled){ cls = 'bg-gray-200 text-gray-400 cursor-not-allowed line-through'; }
    if(inSelSpan){ cls = 'bg-cyan-100 text-cyan-700'; }
    if(isSelStart || isSelEnd){ cls = 'bg-cyan-600 text-white'; }

    cell.className += ' ' + cls;
    cell.innerHTML = '<div>'+day+'</div>';
    cell.title = frFormat(d);

    if(disabledAMPM) cell.title = 'Date indisponible';
    else if(disabledAM) cell.title = 'Disponible à partir de l\'après-midi';
    else if(disabledPM) cell.title = 'Disponible jusqu\'au matin';
    else if(disabled) cell.title = 'Date indisponible';
    
    if(!disabled || ((disabledAM || disabledPM) && !disabledAMPM)){
      cell.addEventListener('click', ()=> onPick(d));
    }

    calWrap.appendChild(cell);
  }

  if(selectingStart){
    hint.textContent = 'Choisissez la date d\'arrivée.';
  } else {
    hint.textContent = 'Choisissez la date de départ.';
  }
}

function onPick(d){
  const stringDateDay = d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,'0')+"-"+String(d.getDate()).padStart(2,'0');
  const formattedSelectedDateStart = new Date(stringDateDay+"T18:00:00Z");
  const formattedSelectedDateEnd = new Date(stringDateDay+"T11:00:00Z");

  if(selectingStart){
    selStart = formattedSelectedDateStart;
    selEnd = null;
    selectingStart = false;
    renderCalendar();
    startInput.dispatchEvent(new Event("change"));
  } else {
    // Ensure order start <= end
    if(selStart && d < selStart){ [selStart, d] = [d, selStart]; }
    // Validate no blocked inside span
    if(spanCrossesBlocked(selStart, formattedSelectedDateEnd)){
      hint.textContent = 'Période invalide : elle traverse des dates bloquées.';
      // clignote rapide
      picker.animate([{transform:'scale(1)'},{transform:'scale(1.02)'},{transform:'scale(1)'}], {duration:180});
      return;
    }
    selEnd = formattedSelectedDateEnd;
    commitSelection();
    closePicker();
    endInput.dispatchEvent(new Event("change"));
  }
}

function commitSelection(){
  if(selStart){
    startInput.value = frFormat(selStart);
    startISO.value   = toISO(selStart);
  }
  if(selEnd){
    endInput.value = frFormat(selEnd);
    endISO.value   = toISO(selEnd);
  }
}
