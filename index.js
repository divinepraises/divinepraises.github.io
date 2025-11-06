import { setDefaultHour, displayCurrentDay, dateToStr } from './script.js';

// select the date
const dateInput = document.getElementById("myDate");
const today = new Date();
dateInput.value = dateToStr(today);

dateInput.addEventListener("change", () => {
	displayCurrentDay(dateInput.value);
});

document.getElementById("midnight").disabled = true;
document.getElementById("matins").disabled = true;

// read choices and use button
document.getElementById("goButton").addEventListener("click", function()  {
    const priest = document.querySelector('input[name="priest"]:checked')?.value;
    const hour = document.querySelector('input[name="hour"]:checked')?.value;
    const full = document.querySelector('input[name="full"]:checked')?.value;
    // Redirect to main page
    window.location.href = `main.html?hour=${encodeURIComponent(hour)}&priest=${encodeURIComponent(priest)}&full=${encodeURIComponent(full)}&date=${encodeURIComponent(dateInput.value)}`;
});
window.onload = setDefaultHour(today);