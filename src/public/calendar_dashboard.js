const now = new Date();
let selectionMode = "EDIT"; // EDIT ADD CONFIG
let reservation = null;

const modalResaId = document.getElementById("dashboardModalId");
const modalResaLastName = document.getElementById("dashboardModalLastName");
const modalResaFisrtName = document.getElementById("dashboardModalFirstName");
const modalResaEmail = document.getElementById("dashboardModalEmail");
const modalResaPhone = document.getElementById("dashboardModalPhone");
const modalResaGuests = document.getElementById("dashboardModalGuests");
const modalResaTotalPrice = document.getElementById("dashboardModalTotalPrice");
const modalResaType = document.getElementById("dashboardModalType");

const addResarvationDashboardBtn = document.getElementById('addReservationBtn');
const editResarvationDashboardBtn = document.getElementById('editReservationBtn');
const dashboardEditModal = document.getElementById("dashboardEditModal");
const dashboardModalLayerReservationChoice = document.getElementById("dashboardModalLayerReservationChoice");
const dashboardModalLayerReservationEdit = document.getElementById("dashboardModalLayerReservationEdit");

function closeModal(){
    document.getElementById("dashboardEditModal").classList.add("hidden");
    reservation = null;
}

function deleteReservation(){
    fetch("/reservation/"+reservation._id, {
      method: 'DELETE',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(res =>{
      if (!res.ok) showToast(res.message, "danger");
      return res.json();
    })
    .then(data => {
      showToast("Réservation supprimée", "success");
      updateBlockedDateRange(data.reservations);
      renderCalendar();
    })
    .catch((err, data)  => showToast('Une erreur est survenue : ' + err , "danger"));

    this.closeModal();
}

function saveReservation(){
  fetch('/reservation', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: modalResaId.value,
        startDate: toISO(formattedSelectedDateStart),
        endDate: toISO(formattedSelectedDateEnd),
        guests: modalResaGuests.value,
        lastname: modalResaLastName.value,
        firstname: modalResaFisrtName.value,
        email: modalResaEmail.value,
        tel: modalResaPhone.value,
        totalPrice: modalResaTotalPrice.value,
        type: modalResaType.value
      })
    })
    .then(res => {
      if (!res.ok){
        showToast(res.message, "danger");
        throw new Error('Erreur réseau');
      }
      return res.json();
    })
    .then(data => {
      if (!data.ok)showToast(data.message, "danger");
      else showToast(data.message, "success");

      if(data.reservations){
        modalResaId.value = "";
        modalResaLastName.value = "";
        modalResaFisrtName.value = "";
        modalResaEmail.value = "";
        modalResaPhone.value = "";
        modalResaGuests.value = "";
        modalResaTotalPrice.value = "";
        modalResaType.value = "";
        updateBlockedDateRange(data.reservations);
        renderCalendar();
      }
    })
    .catch((err, data)  => {
      showToast('Une erreur est survenue, veuillez de nouveau renseigner le formulaire de réservation', "danger");
    });

}

function getReservation(resID){
    fetch("/reservation/"+resID, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(res => {
      if (!res.ok){
        showToast("Erreur lors de la récupération des données liées à la réservation", "danger");
        throw new Error('Erreur réseau');
      }
      return res.json();
    })
    .then(data => {
      reservation = data;
      renderReservation(reservation);
      console.info(data);
    })
    .catch((err, data)  => {
      showToast('Une erreur est survenue : ' + err , "danger");
    });
}

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
    default:
        console.info("Mode inconnu, aucune action exécutée");
    }
}

addResarvationDashboardBtn.addEventListener('click', () =>setCalendarDashboardMode("ADD"));
editResarvationDashboardBtn.addEventListener('click', () =>setCalendarDashboardMode("EDIT"));

function onPick(d, reservationData){
    if(selectionMode == 'ADD'){
        const stringDateDay = d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,'0')+"-"+String(d.getDate()).padStart(2,'0');
        const formattedSelectedDateStart = new Date(stringDateDay+"T18:00:00Z");
        const formattedSelectedDateEnd = new Date(stringDateDay+"T11:00:00Z");

        if(selectingStart){
            selStart = formattedSelectedDateStart;
            selEnd = null;
            selectingStart = false;
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
            dashboardModalLayerReservationEdit.classList.remove("hidden");
            dashboardModalLayerReservationChoice.classList.add("hidden");
            dashboardEditModal.classList.remove("hidden");
            dashboardEditModal.classList.add("flex");
            resetSelection();
        }
        renderCalendar();
    }
    else if(selectionMode == "EDIT"){
        if(reservationData.length > 1){
            renderReservationList(reservationData);
            dashboardModalLayerReservationEdit.classList.add("hidden");
            dashboardModalLayerReservationChoice.classList.remove("hidden");
            dashboardEditModal.classList.remove("hidden");
            dashboardEditModal.classList.add("flex");
        }else if(reservationData.length == 1){
            getReservation(reservationData[0].id)
            dashboardModalLayerReservationEdit.classList.remove("hidden");
            dashboardModalLayerReservationChoice.classList.add("hidden");
            dashboardEditModal.classList.remove("hidden");
            dashboardEditModal.classList.add("flex");
        }
    }
}

function renderReservationList(reservationData){
    const listWrap = document.getElementById('modalReservationListWrap');
    listWrap.innerHTML = '';

    reservationData.forEach((r, idx) => {
        const row = document.createElement('div');
        row.className = 'p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2';

        // Left: label + dates
        const left = document.createElement('div');
        left.className = 'min-w-0';
        const title = document.createElement('div');
        title.className = 'text-sm font-medium text-gray-800 truncate';
        title.textContent = r.guestName ? r.guestName : `Réservation #${r._id ?? (idx+1)}`;

        const dates = document.createElement('div');
        dates.className = 'text-sm text-gray-600';
        dates.textContent = `${frFormat(r.startDate)} → ${frFormat(r.endDate)}`;

        left.appendChild(title);
        left.appendChild(dates);

        // Right: small badges (optional)
        const right = document.createElement('div');
        right.className = 'flex items-center gap-2 flex-wrap';
        // Example badges (you can remove or adapt)
        const badge = document.createElement('span');
        badge.className = 'px-2 py-0.5 text-xs rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200';
        // nights calculation
        const nights = computeNight(r.startDate, r.endDate);
        badge.textContent = `${nights} nuit${nights>1?'s':''}`;
        right.appendChild(badge);

        row.appendChild(left);
        row.appendChild(right);
        listWrap.appendChild(row);
      });
}

function renderReservation(reservationData){
  modalResaId.value = reservationData._id;
  modalResaLastName.value = reservationData.lastname;
  modalResaFisrtName.value = reservationData.firstname;
  modalResaEmail.value = reservationData.email;
  modalResaPhone.value = reservationData.tel;
  modalResaGuests.value = reservationData.guests;
  modalResaTotalPrice.value = reservationData.totalPrice;
  modalResaType.value = reservationData.type;
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
    cellContainer.className = 'relative inline-block w-full rounded-md text-sm text-center';

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
        cellSecondOverlay.className += ' '+ ' cal-cell-end-reservation bg-cyan-600 border-r-4 border-solid border-cyan-900 h-1/2 w-full';
        cellOverlay.className += ' '+ ' cal-cell-start-reservation bg-cyan-600 border-l-4 border-solid border-cyan-900 h-1/2 w-full'
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
    
    if(!inThePast){
      cellContainer.className += ' cursor-pointer';
      cellContainer.addEventListener('click', ()=> onPick(d, reservationData));
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