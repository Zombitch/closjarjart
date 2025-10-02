    // --- Minimal month calendar with events fetched from /api/events ---
    /*const grid = document.getElementById('grid');
    const monthLabel = document.getElementById('monthLabel');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const todayBtn = document.getElementById('todayBtn');

    let viewDate = new Date(); // current month

    async function fetchEvents(startISO, endISO) {
      const url = new URL('/api/events', window.location.origin);
      url.searchParams.set('start', startISO);
      url.searchParams.set('end', endISO);
      const res = await fetch(url.toString());
      return res.ok ? res.json() : [];
    }

    function startOfMonth(d){ return new Date(d.getFullYear(), d.getMonth(), 1); }
    function endOfMonth(d){ return new Date(d.getFullYear(), d.getMonth()+1, 0, 23,59,59,999); }
    function startOfGrid(d){
      const s = startOfMonth(d);
      const day = s.getDay(); // 0 Sun .. 6 Sat
      const g = new Date(s);
      g.setDate(s.getDate() - day);
      return g;
    }

    function fmtMonth(d){
      return d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
    }

    function isSameDay(a,b){
      return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
    }

    function dayKey(d){ return d.toISOString().slice(0,10); }

    async function render() {
      const monthStart = startOfMonth(viewDate);
      const monthEnd = endOfMonth(viewDate);
      const gridStart = startOfGrid(viewDate);
      const today = new Date();

      monthLabel.textContent = fmtMonth(viewDate);

      // Load events for the visible month
      const events = await fetchEvents(monthStart.toISOString(), monthEnd.toISOString());
      const byDay = {};
      for (const ev of events) {
        const key = ev.start?.slice(0,10);
        (byDay[key] ||= []).push(ev);
      }

      grid.innerHTML = '';
      for (let i=0;i<42;i++){ // 6 weeks
        const d = new Date(gridStart); d.setDate(gridStart.getDate()+i);
        const inMonth = d.getMonth() === viewDate.getMonth();
        const key = dayKey(d);
        const dayEvents = byDay[key] || [];

        const cell = document.createElement('button');
        cell.className = [
          'p-2 border -m-[0.5px] text-left focus:outline-none focus:ring-2 focus:ring-blue-500',
          inMonth ? 'bg-white' : 'bg-gray-50 text-gray-400',
          isSameDay(d, today) ? 'relative ring-2 ring-blue-500' : ''
        ].join(' ');

        cell.innerHTML = `
          <div class="flex items-center justify-between">
            <span class="text-sm ${inMonth ? 'text-gray-900' : 'text-gray-400'}">${d.getDate()}</span>
            ${isSameDay(d, today) ? '<span class="ml-2 inline-block w-2 h-2 rounded-full bg-blue-600"></span>' : ''}
          </div>
          <div class="mt-1 space-y-1 overflow-hidden">
            ${dayEvents.slice(0,3).map(e => `
              <div class="truncate text-xs rounded px-1 py-0.5 ${e.color || 'bg-blue-50 text-blue-700'}">
                ${e.title}
              </div>
            `).join('')}
            ${dayEvents.length>3 ? `<div class="text-[11px] text-gray-500">+${dayEvents.length-3} more</div>` : ''}
          </div>
        `;

        cell.addEventListener('click', () => {
          if (dayEvents.length === 0) { alert(key + '\\nNo events'); return; }
          alert(key + '\\n' + dayEvents.map(e => `• ${e.title} (${e.start.slice(11,16)}${e.end ? '–'+e.end.slice(11,16):''})`).join('\\n'));
        });

        grid.appendChild(cell);
      }
    }

    prevBtn.addEventListener('click', () => { viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth()-1, 1); render(); });
    nextBtn.addEventListener('click', () => { viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth()+1, 1); render(); });
    todayBtn.addEventListener('click', () => { viewDate = new Date(); render(); });

    render();


// --- Galerie / Lightbox ---
/*const gallery = [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1472220625704-91e1462799b2?q=80&w=1600&auto=format&fit=crop'
  ];
  let currentIndex = 0;

  function openLightbox(i){ currentIndex = i; setLightbox(); document.getElementById('lightbox').showModal(); }
  function closeLightbox(){ document.getElementById('lightbox').close(); }
  function setLightbox(){ document.getElementById('lightboxImage').src = gallery[currentIndex]; }
  function prevImage(){ currentIndex = (currentIndex - 1 + gallery.length) % gallery.length; setLightbox(); }
  function nextImage(){ currentIndex = (currentIndex + 1) % gallery.length; setLightbox(); }

  // --- Avis toggle ---
  function toggleAllReviews(){
    document.querySelectorAll('.more-review').forEach(el=>el.classList.toggle('hidden'));
  }

  // --- Calcul réservation ---
  const pricePerNight = () => Number(document.getElementById('pricePerNight').textContent);

  function dateDiffInNights(ci, co){
    const inDate = new Date(ci);
    const outDate = new Date(co);
    const ms = outDate - inDate;
    return Math.max(0, Math.round(ms / (1000*60*60*24)));
  }

  function recalc(){
    const ci = document.getElementById('checkIn').value;
    const co = document.getElementById('checkOut').value;
    const nights = dateDiffInNights(ci, co);
    const p = pricePerNight();
    const cleaning = 35;
    const subtotal = nights * p;
    const taxes = Math.round(subtotal * 0.10);
    const total = subtotal + cleaning + taxes;
    document.getElementById('nights').textContent = nights;
    document.getElementById('subtotal').textContent = subtotal;
    document.getElementById('taxes').textContent = taxes;
    document.getElementById('total').textContent = total;
  }

  document.getElementById('checkIn').addEventListener('change', recalc);
  document.getElementById('checkOut').addEventListener('change', recalc);

  function stepGuests(delta){
    const input = document.getElementById('guests');
    const val = Math.min(4, Math.max(1, Number(input.value) + delta));
    input.value = val;
  }

  function showToast(msg){
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.remove('hidden');
    setTimeout(()=> t.classList.add('hidden'), 2200);
  }

  function contactHost(){
    const name = prompt('Votre nom ?');
    if(name === null) return;
    const message = prompt('Votre message pour l\'hôte :');
    if(message === null) return;
    showToast('Message envoyé, merci ' + name + ' !');
  }
*/
// Afficher / masquer le mot de passe
const togglePwd = document.getElementById('togglePwd');
const password = document.getElementById('password');
if(togglePwd){
  const eyeOpen = document.getElementById('eyeOpen');
  const eyeClosed = document.getElementById('eyeClosed');
  togglePwd.addEventListener('click', ()=>{
    togglePassword(eyeOpen, eyeClosed);
  });
}

function togglePassword(openState, closeState){  
  const isPwd = password.getAttribute('type') === 'password';
  password.setAttribute('type', isPwd ? 'text' : 'password');
  openState.classList.toggle('hidden', isPwd);
  closeState.classList.toggle('hidden', !isPwd);
}


//Calcule du nombre de nuit
const dateEnd = document.getElementById('dateEnd');
const dateStartInput = document.getElementById('dateStartISO');
const dateEndInput = document.getElementById('dateEndISO');
const nights = document.getElementById('nights');
const total_price = document.getElementById('total');

dateEnd.addEventListener('change', ()=>{
  if(dateStartInput && dateEndInput){
    nights.innerText = computeNight(dateStartInput.value, dateEndInput.value);
    total_price.innerText = computeTotal();
  }
});

function computeNight(dateStringStart, dateStringEnd){
  const dateStart = new Date(dateStringStart);
  const dateEnd = new Date(dateStringEnd);

  const msPerDay = 1000 * 60 * 60 * 24;
  const utcA = Date.UTC(dateStart.getFullYear(), dateStart.getMonth(), dateStart.getDate());
  const utcB = Date.UTC(dateEnd.getFullYear(), dateEnd.getMonth(), dateEnd.getDate());

  return Math.round((utcB - utcA) / msPerDay);
}

function computeTotal(){
  const pricePerNight = document.getElementById('pricePerNight').innerText;
  return pricePerNight*computeNight(dateStartInput.value, dateEndInput.value);
}

 function stepGuests(delta){
  const input = document.getElementById('guests');
  const val = Math.min(getMaxGuests(), Math.max(1, Number(input.value) + delta));
  input.value = val;
}



// Send data forms
function submitBooking(){
  const nbGuests = document.getElementById('guests');
  const token = document.getElementById('_csrf').value;
  
  if(dateStartInput && dateEndInput && nbGuests){
    fetch('/', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': token
      },
      body: JSON.stringify({
        startDate: dateStartInput.value,
        endDate: dateEndInput.value,
        guests: nbGuests.value
      })
    })
    .then(res => {
      if (!res.ok) throw new Error('Erreur réseau');
      return res.json();
    })
    .then(data => {
      console.log('Réponse du serveur :', data);
    })
    .catch(err => {
      console.error('Erreur:', err);
    });
  }

  // Ici vous pourriez faire un fetch/POST vers votre backend
}
// Année footer & calc init
//document.getElementById('year').textContent = new Date().getFullYear();
/*recalc();*/