import { getDayInfo  } from './script.js';
import { EasterHour } from './minor_hour.js';

export function renderMidnightSkeleton() {
    return `
        <div id="beginning"></div>
    `;
}

export async function enhanceMidnight(priest, full, date){
	let [year, mm, dd, season, seasonWeek, glas, dayOfWeek, dateAddress] = getDayInfo(date, true);
	if (season === "EasterWeek" && dayOfWeek > 0) document.getElementById("beginning").innerHTML =  await EasterHour("compline", priest, full, date);
	else document.getElementById("beginning").innerHTML = "This hour is not ready yet."
}