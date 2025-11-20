

  let currentPhotoIndex = 0;
  const lightbox = document.getElementById('photoLightbox');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxCounter = document.getElementById('lightboxCounter');

  function updateLightbox() {
      if (!getLightboxPhotos().length) return;
      const photo = getLightboxPhotos()[currentPhotoIndex];
      if (photo) {
          lightboxImage.src = photo.url;
          lightboxCounter.textContent = `${currentPhotoIndex + 1} / ${getLightboxPhotos().length}`;
      }
  }

  function openLightbox(index) {
      if (!getLightboxPhotos().length) return;
      currentPhotoIndex = index;
      updateLightbox();
      lightbox.classList.remove('hidden');
      lightbox.classList.add('flex');
      document.body.classList.add('overflow-hidden');
  }

  function closeLightbox() {
      lightbox.classList.add('hidden');
      lightbox.classList.remove('flex');
      document.body.classList.remove('overflow-hidden');
  }

  function nextPhoto() {
      currentPhotoIndex = (currentPhotoIndex + 1) % getLightboxPhotos().length;
      updateLightbox();
  }

  function previousPhoto() {
      currentPhotoIndex = (currentPhotoIndex - 1 + getLightboxPhotos().length) % getLightboxPhotos().length;
      updateLightbox();
  }

  lightbox?.addEventListener('click', (event) => {
      if (event.target === lightbox) {
          closeLightbox();
      }
  });

  window.addEventListener('keydown', (event) => {
      if (lightbox && lightbox.classList.contains('hidden')) return;
      if (event.key === 'Escape') {
          closeLightbox();
      } else if (event.key === 'ArrowRight') {
          nextPhoto();
      } else if (event.key === 'ArrowLeft') {
          previousPhoto();
      }
  });

  window.openLightbox = openLightbox;
  window.closeLightbox = closeLightbox;
  window.nextPhoto = nextPhoto;
  window.previousPhoto = previousPhoto;

// Affiche le toast
function showToast(msg, type){
  const t = document.getElementById('toast');
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

if(dateEnd){
  dateEnd.addEventListener('change', ()=>{
    if(dateStartInput && dateEndInput && nights){
      const totalNightPrice = computeNightPriceTotal();
      nights.innerText = computeNight(dateStartInput.value, dateEndInput.value);
      if(fees_management) fees_management.innerText = computeFees(totalNightPrice);
      total_price.innerText = computeTotal();
    }
  });
}

function computeNight(dateStringStart, dateStringEnd){
  const dateStart = new Date(dateStringStart);
  const dateEnd = new Date(dateStringEnd);

  const msPerDay = 1000 * 60 * 60 * 24;
  const utcA = Date.UTC(dateStart.getFullYear(), dateStart.getMonth(), dateStart.getDate());
  const utcB = Date.UTC(dateEnd.getFullYear(), dateEnd.getMonth(), dateEnd.getDate());

  return Math.round((utcB - utcA) / msPerDay);
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
  const emailInput = document.getElementById('email');
  const telInput = document.getElementById('tel');
  const lastnameInput = document.getElementById('lastname');
  const firstnameInput = document.getElementById('firstname');
  
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
        guests: nbGuests.value,
        lastname: lastnameInput.value,
        firstname: firstnameInput.value,
        email: emailInput.value,
        tel: telInput.value
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
        startInput.value = "";
        endInput.value = "";
        dateStartInput.value = "";
        dateEndInput.value = "";
        telInput.value = "";
        emailInput.value = "";
        lastnameInput.value = "";
        firstnameInput.value = "";
        updateBlockedDateRange(data.reservations);
      }
    })
    .catch((err, data)  => {
      showToast('Une erreur est survenue, veuillez de nouveau renseigner le formulaire de réservation', "danger");
    });
  }

  // Ici vous pourriez faire un fetch/POST vers votre backend
}
// Année footer & calc init
//document.getElementById('year').textContent = new Date().getFullYear();
/*recalc();*/