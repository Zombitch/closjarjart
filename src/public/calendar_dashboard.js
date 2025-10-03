const now = new Date();
let selectionMode = "EDIT"; // EDIT ADD DELETE
const addResarvationDashboardBtn = document.getElementById('addReservationBtn');
const editResarvationDashboardBtn = document.getElementById('editReservationBtn');
const deleteResarvationDashboardBtn = document.getElementById('deleteReservationBtn');
const dashboardEditModal = document.getElementById("dashboardEditModal");

function activeSelectedModeButton(btn){
    btn.classList.add("bg-cyan-600", "hover:bg-cyan-700");
    btn.classList.remove("bg-gray-200", "hover:bg-gray-300"); 

    if(btn != addResarvationDashboardBtn){
        addResarvationDashboardBtn.classList.remove("bg-cyan-600", "hover:bg-cyan-700");
        addResarvationDashboardBtn.classList.add("bg-gray-200", "hover:bg-gray-300"); 
    }
    if(btn != editResarvationDashboardBtn){
        editResarvationDashboardBtn.classList.remove("bg-cyan-600", "hover:bg-cyan-700");
        editResarvationDashboardBtn.classList.add("bg-gray-200", "hover:bg-gray-300"); 
    }
    if(btn != deleteResarvationDashboardBtn){
        deleteResarvationDashboardBtn.classList.remove("bg-cyan-600", "hover:bg-cyan-700");
        deleteResarvationDashboardBtn.classList.add("bg-gray-200", "hover:bg-gray-300"); 
    }
}

function setCalendarDashboardMode(mode){
    selectionMode = mode;
    
    switch (mode) {
    case "ADD":
        activeSelectedModeButton(addResarvationDashboardBtn);
        break;
    case "EDIT":
        activeSelectedModeButton(editResarvationDashboardBtn);
        break;
    case "DELETE":
        activeSelectedModeButton(deleteResarvationDashboardBtn);
        break;
    default:
        console.log("Mode inconnu, aucune action exécutée");
    }
}

addResarvationDashboardBtn.addEventListener('click', () =>setCalendarDashboardMode("ADD"));
editResarvationDashboardBtn.addEventListener('click', () =>setCalendarDashboardMode("EDIT"));
deleteResarvationDashboardBtn.addEventListener('click', () =>setCalendarDashboardMode("DELETE"));

function onPick(d){
    if(selectionMode == 'ADD'){
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
    else if(selectionMode == "EDIT"){
        dashboardEditModal.classList.remove("hidden");
        dashboardEditModal.classList.add("flex");
    }
}


function renderCalendar(){
  const first = new Date(viewYear, viewMonth, 1);
  const startWeekday = (first.getDay()+6)%7; // Lundi=0
  const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate();
  monthLabel.textContent = first.toLocaleDateString('fr-FR', { month:'long', year:'numeric' });

  calWrap.innerHTML = '';
  // padding cells
  for(let i=0;i<startWeekday;i++){ const pad = document.createElement('div'); calWrap.appendChild(pad); }

  let lastSettings = "bg-cyan-600";
  for(let day=1; day<=daysInMonth; day++){
    const d = new Date(viewYear, viewMonth, day);
    const cellContainer = document.createElement('div');
    cellContainer.className = 'relative inline-block w-full rounded-md text-sm text-center ';

    const cellOverlay = document.createElement('div');
    cellOverlay.className = 'absolute flex items-center justify-center text-white text-xs'

    const cellSecondOverlay = document.createElement('div');
    cellSecondOverlay.className = 'absolute flex items-center justify-center'

    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'relative cal-cell z-10';

    // State classes
    const reservationData = getRangeData(d);
    const disabled = isBlocked(d);
    const inThePast = d < new Date()
    const disabledAM = isBlockedAM(d);
    const disabledPM = isBlockedPM(d);
    const disabledAMPM = isBlockedAM(d) && isBlockedPM(d);
    const isSelStart = selStart && cmpDate(d, selStart)===0;
    const isSelEnd   = selEnd   && cmpDate(d, selEnd)===0;
    const inSelSpan  = selStart && selEnd && inRange(d, selStart, selEnd);

    let cls = 'hover:bg-blue-50';
    if(inThePast){
        cls = 'bg-gray-200 text-gray-400 cursor-not-allowed line-through';
    }
    else if(disabledAMPM){
        cellSecondOverlay.className += ' '+ 'cal-cell-end-reservation bg-cyan-600 border-r-4 border-solid border-cyan-900 h-1/2 w-full';
        cellOverlay.className += ' '+ 'cal-cell-start-reservation bg-cyan-600 border-l-4 border-solid border-cyan-900 h-1/2 w-full'
        lastSettings = 'bg-cyan-600';
    }
    else if(disabledAM){ 
        cls = 'cal-cell-blocked-am';
        cellOverlay.className += ' ' + lastSettings + ' '+ 'cal-cell-end-reservation border-r-4 border-solid border-cyan-900 h-1/2 w-full'
    }
    else if(disabledPM){
        cls = 'cal-cell-blocked-pm';
        cellOverlay.className += ' ' + lastSettings +' '+ 'cal-cell-start-reservation border-l-4 border-solid border-cyan-900 h-1/2 w-full'
    }
    else if(disabled){
        cls = lastSettings;
    }
    if(inSelSpan){ cls = 'bg-blue-100 text-blue-700'; }
    if(isSelStart || isSelEnd){ cls = 'bg-blue-600 text-white'; }

    cellContainer.className += ' ' + cls;
    cell.innerHTML = '<div>'+day+'</div>';
    cell.title = frFormat(d);

    if(disabledAMPM) cell.title = 'Date indisponible';
    else if(disabledAM) cell.title = 'Disponible à partir de l\'après-midi';
    else if(disabledPM) cell.title = 'Disponible jusqu\'au matin';
    else if(disabled) cell.title = 'Date indisponible';
    
    if(!disabled || ((disabledAM || disabledPM) && !disabledAMPM)){
      cell.addEventListener('click', ()=> onPick(d));
    }

    cellContainer.appendChild(cellOverlay);
    cellContainer.appendChild(cellSecondOverlay);
    cellContainer.appendChild(cell);
    calWrap.appendChild(cellContainer);
  }

  if(selectingStart){
    hint.textContent = 'Choisissez la date d\'arrivée.';
  } else {
    hint.textContent = 'Choisissez la date de départ.';
  }
}

setViewDate(now);
setCalendarDashboardMode("EDIT");
renderCalendar();