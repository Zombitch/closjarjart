let blockedDateRanges = [['2025-01-01 18:00:00','2025-01-02 11:00:00']];
let maxGuests = 0;
let maintenanceMode = false;

function setConfig(blocked, guests, maintenance = false){
    blockedDateRanges = blocked;
    maxGuests = guests;
    
    if(maintenance === true || maintenance == "true" || maintenance == 1) maintenanceMode = true;
    else maintenanceMode = false;
}

const getMaintenanceMode = () => maintenanceMode;
const setMaintenanceMode = (m) => maintenanceMode = m;
const getMaxGuests = () => maxGuests;
const getBlockedDateRanges = () => blockedDateRanges;