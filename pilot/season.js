'use strict';

window.Seasonal = (() => {
    const firstV1Id = 6001;
    const v1Size = 125;
    function dateKey(date) {
        return String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
    }

    function inSeason(date = new Date()) {
        const key = dateKey(date);
        return key >= '11-18' || key <= '01-14';
    }

    function available(card, date) {
        const key = dateKey(date);
        if (!inSeason(date) || !card.facets.holiday.dateRanges.some(({from,to}) => from <= to
            ? from <= key && key <= to : key >= from || key <= to)) return false;
        if (!card.timeWindows) return true;
        const time = String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
        return card.timeWindows.some(window => window.date === key && window.from <= time && time < window.until);
    }

    function seedCardKey(randomFraction) {
        // The v1 range is immutable so a saved seed does not move with the calendar or exclusions.
        return 'n:' + (firstV1Id + Math.floor(randomFraction * v1Size));
    }

    function isV1Key(key) {
        const id = Number(key.slice(2));
        return key.startsWith('n:') && Number.isInteger(id) && id >= firstV1Id && id < firstV1Id + v1Size;
    }

    return {inSeason, available, seedCardKey, isV1Key};
})();
