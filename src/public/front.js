let currentPhotoIndex = 0;
const lightbox = document.getElementById('photoLightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxCounter = document.getElementById('lightboxCounter');

function updateLightbox() {
  const photos = getLightboxPhotos();
  if (!photos.length || !lightboxImage || !lightboxCounter) return;

  const safeIndex = Math.max(0, Math.min(currentPhotoIndex, photos.length - 1));
  currentPhotoIndex = safeIndex;

  const photo = photos[safeIndex];
  lightboxImage.src = photo.url;
  lightboxCounter.textContent = `${safeIndex + 1} / ${photos.length}`;
}

function openLightbox(index) {
  const photos = getLightboxPhotos();
  if (!photos.length || !lightbox) return;
  currentPhotoIndex = Number.isInteger(index) ? index : 0;
  updateLightbox();
  lightbox.classList.remove('hidden');
  lightbox.classList.add('flex');
  document.body.classList.add('overflow-hidden');
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.add('hidden');
  lightbox.classList.remove('flex');
  document.body.classList.remove('overflow-hidden');
}

function nextPhoto() {
  const photos = getLightboxPhotos();
  if (!photos.length) return;
  currentPhotoIndex = (currentPhotoIndex + 1) % photos.length;
  updateLightbox();
}

function previousPhoto() {
  const photos = getLightboxPhotos();
  if (!photos.length) return;
  currentPhotoIndex = (currentPhotoIndex - 1 + photos.length) % photos.length;
  updateLightbox();
}

lightbox?.addEventListener('click', (event) => {
  if (event.target === lightbox) closeLightbox();
});

window.addEventListener('keydown', (event) => {
  if (lightbox && lightbox.classList.contains('hidden')) return;
  if (event.key === 'Escape') closeLightbox();
  else if (event.key === 'ArrowRight') nextPhoto();
  else if (event.key === 'ArrowLeft') previousPhoto();
});

window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.nextPhoto = nextPhoto;
window.previousPhoto = previousPhoto;

// Affiche le toast
function showToast(msg, type){
  const t = document.getElementById('toast');
  if(!t) return;
  let bgClass;

  if(type == "danger") bgClass= "bg-red-600";
  else bgClass= "bg-green-600";

  t.textContent = msg; 
  t.classList.remove('hidden');
  t.classList.add(bgClass);

  setTimeout(()=> {
    t.classList.add('hidden');
    t.classList.remove(bgClass);
  }, 10000);
}


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
  if(!password || !openState || !closeState) return;
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
const fees_management = document.getElementById('fees_management');
const total_price = document.getElementById('total');
const bookingForm = document.getElementById('bookingForm');
const guestsInput = document.getElementById('guests');

if(dateEnd){
  dateEnd.addEventListener('change', recalcBookingSummary);
}

if(dateStartInput){
  dateStartInput.addEventListener('change', recalcBookingSummary);
}

if(guestsInput){
  guestsInput.addEventListener('change', () => {
    const val = Math.min(getMaxGuests(), Math.max(1, Number(guestsInput.value) || 1));
    guestsInput.value = String(val);
  });
}

function computeNight(dateStringStart, dateStringEnd){
  if(!dateStringStart || !dateStringEnd) return 0;
  const dateStart = new Date(dateStringStart);
  const dateEnd = new Date(dateStringEnd);
  if(Number.isNaN(dateStart.getTime()) || Number.isNaN(dateEnd.getTime())) return 0;

  const msPerDay = 1000 * 60 * 60 * 24;
  const utcA = Date.UTC(dateStart.getFullYear(), dateStart.getMonth(), dateStart.getDate());
  const utcB = Date.UTC(dateEnd.getFullYear(), dateEnd.getMonth(), dateEnd.getDate());

  return Math.max(0, Math.round((utcB - utcA) / msPerDay));
}

function computeFees(totalPrice){
  return ((totalPrice * 1.25/100) + 0.25);
}

function computeTotal(){
  const totalNightPrice = computeNightPriceTotal();
  return totalNightPrice;
  //return totalNightPrice+computeFees(totalNightPrice);
}

function computeNightPriceTotal(){
  const priceNode = document.getElementById('pricePerNight');
  if(!priceNode || !dateStartInput || !dateEndInput) return 0;
  const pricePerNight = Number(priceNode.innerText) || 0;
  return pricePerNight * computeNight(dateStartInput.value, dateEndInput.value);
}

function recalcBookingSummary(){
  if(!dateStartInput || !dateEndInput || !nights || !total_price) return;
  const totalNightPrice = computeNightPriceTotal();
  nights.innerText = String(computeNight(dateStartInput.value, dateEndInput.value));
  if(fees_management) fees_management.innerText = String(computeFees(totalNightPrice));
  total_price.innerText = String(computeTotal());
}

function stepGuests(delta){
  const input = document.getElementById('guests');
  if(!input) return;
  const val = Math.min(getMaxGuests(), Math.max(1, Number(input.value) + delta));
  input.value = val;
}

// Send data forms
function submitBooking(){
  const nbGuests = document.getElementById('guests');
  const token = document.getElementById('_csrf')?.value;
  const emailInput = document.getElementById('email');
  const telInput = document.getElementById('tel');
  const lastnameInput = document.getElementById('lastname');
  const firstnameInput = document.getElementById('firstname');
  
  if(!bookingForm?.checkValidity()){
    bookingForm?.reportValidity();
    return;
  }

  if(dateStartInput && dateEndInput && nbGuests && emailInput && telInput && lastnameInput && firstnameInput && token){
    if(computeNight(dateStartInput.value, dateEndInput.value) <= 0){
      showToast('Une erreur est survenue, veuillez de nouveau renseigner le formulaire de réservation', "danger");
      return;
    }
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
        guests: nbGuests.value,
        lastname: lastnameInput.value,
        firstname: firstnameInput.value,
        email: emailInput.value,
        tel: telInput.value
      })
    })
    .then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok){
        showToast(data.message || 'Une erreur est survenue, veuillez de nouveau renseigner le formulaire de réservation', "danger");
        throw new Error('Erreur réseau');
      }
      return data;
    })
    .then(data => {
      if (!data.ok)showToast(data.message, "danger");
      else showToast(data.message, "success");

      if(data.reservations){
        startInput.value = "";
        endInput.value = "";
        dateStartInput.value = "";
        dateEndInput.value = "";
        telInput.value = "";
        emailInput.value = "";
        lastnameInput.value = "";
        firstnameInput.value = "";
        updateBlockedDateRange(data.reservations);
        recalcBookingSummary();
      }
    })
    .catch(()  => {
      showToast('Une erreur est survenue, veuillez de nouveau renseigner le formulaire de réservation', "danger");
    })
  }

  // Ici vous pourriez faire un fetch/POST vers votre backend
}
// Année footer & calc init
//document.getElementById('year').textContent = new Date().getFullYear();
/*recalc();*/
