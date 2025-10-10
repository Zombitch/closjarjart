const addPhotoBtn = document.getElementById('addPhotoBtn');
const photosInput = document.getElementById('cfg_photos');
const photosCountLabel = document.getElementById('selectedPhotoCount');
const toggleMainteanceBtn = document.getElementById('toggleMaintenanceBtn');
const toggleMaintenanceCircle = document.getElementById('toggleMaintenanceCircle');
const toggleMaintenanceLabel = document.getElementById('toggleMaintenanceLabel');
const toogleMaintenanceInput = document.getElementById('toogleMaintenanceInput');

if(addPhotoBtn && photosInput){
    addPhotoBtn.addEventListener('click', () => photosInput.click());
    photosInput.addEventListener('change', () => {
        if (photosInput.files.length === 0) {
        photosCountLabel.textContent = 'Aucune';
        } else {
        photosCountLabel.textContent = `${photosInput.files.length}`;
        }
    });

    // Simple tab management
    const tabs = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.tab-panel');

    function activateTab(tabName) {
        tabs.forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.classList.add("border-cyan-500", "text-cyan-600");
                btn.classList.remove("text-gray-500", "border-transparent");
            } else {
                btn.classList.remove("border-cyan-500", "text-cyan-600");
                btn.classList.add("text-gray-500", "border-transparent");
            }
        });

        panels.forEach(panel => {
            panel.classList.toggle("hidden", panel.id !== "tab-" + tabName);
        });
    }

    tabs.forEach(btn => {
        btn.addEventListener("click", () => activateTab(btn.dataset.tab));
    });

    // Default tab
    activateTab("price");
}

if(toggleMainteanceBtn){
    toggleMainteanceBtn.addEventListener("click", () => {
        setMaintenanceMode(!maintenanceMode);
        toogleMaintenanceInput.value = getMaintenanceMode().toString();
        renderToogleMaintenance();
    })
}

function renderToogleMaintenance(){
    if(getMaintenanceMode()){
        toggleMainteanceBtn.classList.replace('bg-gray-300', 'bg-cyan-600');
        toggleMaintenanceCircle.classList.add('translate-x-6');
        toggleMaintenanceLabel.textContent = 'Activé';
        toggleMaintenanceLabel.classList.replace('text-gray-600', 'text-cyan-600');
    } else {
        toggleMainteanceBtn.classList.replace('bg-cyan-600', 'bg-gray-300');
        toggleMaintenanceCircle.classList.remove('translate-x-6');
        toggleMaintenanceLabel.textContent = 'Désactivé';
        toggleMaintenanceLabel.classList.replace('text-cyan-600', 'text-gray-600');
    }
}

renderToogleMaintenance();