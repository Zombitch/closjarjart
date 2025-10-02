let blockedDateRanges = [['2025-01-01 18:00:00','2025-01-02 11:00:00']];
let maxGuests = 0;

function setConfig(blocked, guests){
    blockedDateRanges = blocked;
    maxGuests = guests;
}

const getMaxGuests = () => maxGuests;
const getBlockedDateRanges = () => blockedDateRanges;