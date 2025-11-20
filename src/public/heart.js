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

const visitDetails = document.getElementById('visitDetails');
const visitDetailsTitle = document.getElementById('visitDetailsTitle');
const visitChart = document.getElementById('visitChart');
const visitChartHint = document.getElementById('visitChartHint');
const visitTableBody = document.getElementById('visitTableBody');
const closeVisitDetails = document.getElementById('closeVisitDetails');

function buildDayMap(days, month, year){
    const totalDays = new Date(Number(year), Number(month), 0).getDate();
    const dayMap = new Map();
    for(let i=1;i<=totalDays;i++) dayMap.set(i, 0);
    days.forEach(d => dayMap.set(d.day, d.count));
    return dayMap;
}

function renderVisitChart(days, month, year){
    if(!visitChart) return;
    visitChart.innerHTML = '';
    const dayMap = buildDayMap(days, month, year);
    const maxCount = Math.max(...Array.from(dayMap.values()), 0);
    const totalVisits = Array.from(dayMap.values()).reduce((a,b)=>a+b,0);

    if(maxCount === 0){
        const empty = document.createElement('p');
        empty.className = 'text-sm text-gray-500';
        empty.textContent = "Aucune visite enregistrée pour ce mois.";
        visitChart.appendChild(empty);
        if(visitChartHint) visitChartHint.textContent = '';
        return;
    }

    const list = document.createElement('div');
    list.className = 'flex flex-col divide-y divide-gray-200';

    dayMap.forEach((count, day) => {
        const row = document.createElement('div');
        row.className = 'flex items-center gap-3 py-2';

        const dayInfo = document.createElement('div');
        dayInfo.className = 'flex flex-col min-w-[64px]';
        const dateValue = new Date(Number(year), Number(month) - 1, Number(day));

        const dayName = document.createElement('span');
        dayName.className = 'text-xs uppercase text-gray-500 tracking-wide';
        dayName.textContent = dateValue.toLocaleDateString('fr-FR', { weekday: 'short' });

        const dayNumber = document.createElement('span');
        dayNumber.className = 'text-base font-semibold text-gray-800';
        dayNumber.textContent = day.toString();

        dayInfo.appendChild(dayName);
        dayInfo.appendChild(dayNumber);

        const countLabel = document.createElement('div');
        countLabel.className = 'text-sm font-medium text-gray-700 w-10 text-right';
        countLabel.textContent = count.toString();

        const barContainer = document.createElement('div');
        barContainer.className = 'flex-1 h-3 bg-gray-100 rounded-full overflow-hidden';
        const bar = document.createElement('div');
        bar.className = 'h-full bg-cyan-500 rounded-full';
        const ratio = maxCount === 0 ? 0 : (count / maxCount) * 100;
        bar.style.width = `${ratio}%`;
        barContainer.appendChild(bar);

        row.appendChild(dayInfo);
        row.appendChild(countLabel);
        row.appendChild(barContainer);
        list.appendChild(row);
    });

    visitChart.appendChild(list);

    if(visitChartHint) visitChartHint.textContent = `${totalVisits} visite(s) réparties sur ${dayMap.size} jour(s).`;
}

function renderVisitTable(visits){
    if(!visitTableBody) return;
    visitTableBody.innerHTML = '';

    if(!visits || visits.length === 0){
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 4;
        cell.className = 'px-4 py-3 text-center text-gray-500';
        cell.textContent = "Aucune visite pour ce mois.";
        row.appendChild(cell);
        visitTableBody.appendChild(row);
        return;
    }

    visits.forEach(v => {
        const row = document.createElement('tr');

        const date = document.createElement('td');
        date.className = 'px-4 py-3 whitespace-nowrap';
        const dateValue = new Date(v.createdAt);
        date.textContent = dateValue.toLocaleString('fr-FR');

        const ip = document.createElement('td');
        ip.className = 'px-4 py-3';
        ip.textContent = v.ip || '-';

        const origin = document.createElement('td');
        origin.className = 'px-4 py-3';
        origin.textContent = v.origin || '-';

        row.appendChild(date);
        row.appendChild(ip);
        row.appendChild(origin);
        visitTableBody.appendChild(row);
    });
}

async function handleMonthlyVisitClick(year, month, monthName){
    if(!visitDetails || !visitDetailsTitle) return;
    visitDetailsTitle.textContent = `${monthName} ${year}`;
    visitDetails.classList.remove('hidden');
    if(visitChart) visitChart.innerHTML = '<p class="text-sm text-gray-500">Chargement...</p>';
    if(visitChartHint) visitChartHint.textContent = '';
    if(visitTableBody) visitTableBody.innerHTML = '';

    try{
        const response = await fetch(`/heart/visits/${year}/${month}`);
        const payload = await response.json();
        if(!payload.ok){
            throw new Error(payload.message || 'Erreur lors du chargement des visites');
        }

        renderVisitChart(payload.days || [], Number(month), Number(year));
        renderVisitTable(payload.visits || []);
    } catch (err){
        if(visitChart) visitChart.innerHTML = `<p class="text-sm text-red-500">${err.message}</p>`;
    }
}

if(closeVisitDetails){
    closeVisitDetails.addEventListener('click', () => {
        visitDetails?.classList.add('hidden');
    });
}

document.querySelectorAll('.monthly-visit-row').forEach(row => {
    row.addEventListener('click', () => {
        const year = row.getAttribute('data-year');
        const month = row.getAttribute('data-month');
        const monthName = row.getAttribute('data-month-name');
        if(year && month && monthName){
            handleMonthlyVisitClick(year, month, monthName);
        }
    });
});