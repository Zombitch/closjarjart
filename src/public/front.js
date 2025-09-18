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

  function submitBooking(){
    // Simple validation
    const ci = document.getElementById('checkIn').value;
    const co = document.getElementById('checkOut').value;
    const nights = dateDiffInNights(ci, co);
    if(nights <= 0){ alert('Sélectionnez des dates valides.'); return; }
    showToast('Votre demande de réservation a été envoyée.');
    // Ici vous pourriez faire un fetch/POST vers votre backend
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

// Année footer & calc init
//document.getElementById('year').textContent = new Date().getFullYear();
/*recalc();*/