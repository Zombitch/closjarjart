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
const visitCards = document.getElementById('visitCards');
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
    if(visitTableBody) visitTableBody.innerHTML = '';
    if(visitCards) visitCards.innerHTML = '';

    if(!visits || visits.length === 0){
        if(visitTableBody){
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 4;
            cell.className = 'px-4 py-3 text-center text-gray-500';
            cell.textContent = "Aucune visite pour ce mois.";
            row.appendChild(cell);
            visitTableBody.appendChild(row);
        }

        if(visitCards){
            const empty = document.createElement('div');
            empty.className = 'px-4 py-4 text-sm text-gray-500';
            empty.textContent = "Aucune visite pour ce mois.";
            visitCards.appendChild(empty);
        }
        return;
    }

    visits.forEach(v => {
        const dateValue = new Date(v.createdAt);
        const formattedDate = dateValue.toLocaleString('fr-FR');
        const originValue = v.origin || '-';
        const agentValue = v.agent || '-';
        const ipValue = v.ip || '-';
        const langValue = v.lang;
        const isRobot = Boolean(v.isRobot);

        if(visitCards){
            const card = document.createElement('div');
            card.className = 'px-4 py-3';

            const header = document.createElement('div');
            header.className = 'flex items-center justify-between gap-2';

            const date = document.createElement('div');
            date.className = 'flex items-center gap-2 text-sm font-semibold text-gray-900';
            date.appendChild(createVisitIcon(isRobot));
            const dateText = document.createElement('span');
            dateText.textContent = formattedDate;
            date.appendChild(dateText);

            const origin = document.createElement('span');
            origin.className = 'inline-flex items-center rounded-full border border-cyan-100 bg-cyan-50 px-2 py-1 text-[11px] font-medium text-cyan-800';
            origin.textContent = originValue;

            header.appendChild(date);
            header.appendChild(origin);

            const details = document.createElement('div');
            details.className = 'mt-2 space-y-1 text-sm text-gray-800 hidden';

            const agent = document.createElement('p');
            agent.textContent = agentValue;
            details.appendChild(agent);

            if(langValue){
                const langTag = document.createElement('p');
                langTag.className = 'text-xs text-gray-600';
                langTag.textContent = `Langue : ${langValue}`;
                details.appendChild(langTag);
            }

            const ip = document.createElement('p');
            ip.className = 'text-xs font-mono text-gray-700';
            ip.textContent = `IP : ${ipValue}`;
            details.appendChild(ip);

            const toggleBtn = document.createElement('button');
            toggleBtn.type = 'button';
            toggleBtn.className = 'mt-2 inline-flex items-center gap-1 text-xs font-medium text-cyan-700';
            toggleBtn.textContent = 'Afficher les détails';
            toggleBtn.addEventListener('click', () => {
                const isHidden = details.classList.contains('hidden');
                details.classList.toggle('hidden', !isHidden);
                toggleBtn.textContent = isHidden ? 'Masquer les détails' : 'Afficher les détails';
            });

            card.appendChild(header);
            card.appendChild(toggleBtn);
            card.appendChild(details);
            visitCards.appendChild(card);
        }

        if(visitTableBody){
            const row = document.createElement('tr');

            const dateCell = document.createElement('td');
            dateCell.className = 'px-4 py-3 whitespace-nowrap';
            const dateContent = document.createElement('div');
            dateContent.className = 'flex items-center gap-2';
            dateContent.appendChild(createVisitIcon(isRobot));
            const dateText = document.createElement('span');
            dateText.textContent = formattedDate;
            dateContent.appendChild(dateText);
            dateCell.appendChild(dateContent);

            const originCell = document.createElement('td');
            originCell.className = 'px-4 py-3';
            originCell.textContent = originValue;

            const agentCell = document.createElement('td');
            agentCell.className = 'px-4 py-3';
            agentCell.textContent = agentValue;

            const ipCell = document.createElement('td');
            ipCell.className = 'px-4 py-3 font-mono text-xs text-gray-700';
            ipCell.textContent = ipValue;

            row.appendChild(dateCell);
            row.appendChild(originCell);
            row.appendChild(agentCell);
            row.appendChild(ipCell);
            visitTableBody.appendChild(row);
        }
    });
}

function createVisitIcon(isRobot){
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', `h-4 w-4 ${isRobot ? 'text-amber-600' : 'text-gray-600'}`);
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.6');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');

    if(isRobot){
        const antenna = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        antenna.setAttribute('x1', '12');
        antenna.setAttribute('y1', '3');
        antenna.setAttribute('x2', '12');
        antenna.setAttribute('y2', '5');

        const head = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        head.setAttribute('x', '5');
        head.setAttribute('y', '7.5');
        head.setAttribute('width', '14');
        head.setAttribute('height', '10');
        head.setAttribute('rx', '2');

        const eyeLeft = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        eyeLeft.setAttribute('cx', '10');
        eyeLeft.setAttribute('cy', '12');
        eyeLeft.setAttribute('r', '0.9');

        const eyeRight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        eyeRight.setAttribute('cx', '14');
        eyeRight.setAttribute('cy', '12');
        eyeRight.setAttribute('r', '0.9');

        const mouth = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        mouth.setAttribute('x1', '9');
        mouth.setAttribute('y1', '15');
        mouth.setAttribute('x2', '15');
        mouth.setAttribute('y2', '15');

        svg.appendChild(antenna);
        svg.appendChild(head);
        svg.appendChild(eyeLeft);
        svg.appendChild(eyeRight);
        svg.appendChild(mouth);
        return svg;
    }

    const head = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    head.setAttribute('cx', '12');
    head.setAttribute('cy', '8');
    head.setAttribute('r', '3');

    const shoulders = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    shoulders.setAttribute('d', 'M6 19c0-3.3137 2.6863-6 6-6s6 2.6863 6 6');

    const body = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    body.setAttribute('d', 'M9.5 18.5c0-1.3807 1.1193-2.5 2.5-2.5s2.5 1.1193 2.5 2.5');

    svg.appendChild(head);
    svg.appendChild(shoulders);
    svg.appendChild(body);
    return svg;
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
