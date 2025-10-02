const addPhotoBtn = document.getElementById('addPhotoBtn');
const photosInput = document.getElementById('cfg_photos');
const photosCountLabel = document.getElementById('selectedPhotoCount');

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