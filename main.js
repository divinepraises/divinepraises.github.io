import { renderVespersSkeleton, enhanceVespers } from './vespers.js';
import { compline } from './compline.js';
import { matins } from './matins.js';
import { minorHour } from './minor_hour.js';
//import { liturgy } from './liturgy.js';

const params = new URLSearchParams(window.location.search);
const hour = params.get("hour");
const priest = params.get("priest")
const full = params.get("full")
const date = params.get("date")

const contentDiv = document.getElementById("content");

var selectedVersion = document.querySelector('input[name="option"]:checked');
if (hour === "1hour" || hour === "3hour" || hour === "6hour" || hour === "9hour") {
    contentDiv.innerHTML = await minorHour(hour, priest, full, date);
} else if (hour === "compline"){
    contentDiv.innerHTML = await compline(priest, full, date);
} else if (hour === "vespers"){
    contentDiv.innerHTML = renderVespersSkeleton();
    await enhanceVespers(priest, full, date);
} else if (hour === "liturgy"){
    contentDiv.innerHTML = await liturgy(date);
} else {
    contentDiv.innerHTML = matins();
}