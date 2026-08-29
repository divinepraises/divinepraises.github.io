import {
    usualBeginning,
    comeLetUs,
    trisagionToPater,
    glory, andNow, gloryAndNow,
    itIsTrulyRight, moreHonorable,
    LHM,
    prayerOfTheHours,
    prayerBlessingMayGodBeGracious,
    inTheName,
    amen
} from './text_generation.js';
import { getDayInfo, getData, readPsalmsFromNumbers, kathismaToText } from './script.js';
import { EasterHour } from './minor_hour.js';

const address = `Text\\English`

export function renderMidnightSkeleton() {
    return `
        <div id="beginning"></div>
        <div id="kathisma_or_canon"></div>
        <div id="creed_or_gregory"></div>
        <div id="trisagionToPater"></div>
        <div id="troparia_1"></div>
        <div id="all_hours_prayer"></div>
        <div id="st_ephrem"></div>
        <div id="prayer_of_this_hour"></div>  // sat and sun - optional
        <div id="psalms_2"></div> // come let us - gn trisagionToPater || -
        <div id="troparia_2"></div>
        <div id="prayer_dead"></div>  // 12 lhm + prayer
        <div id="penitential_troparia"></div>
        <div id="endingBlock"></div>  // can import from compline
        <div id="after_prayers"></div>
    `;
}

export async function enhanceMidnight(priest, full, date){
	let [year, mm, dd, season, seasonWeek, glas, dayOfWeek, dateAddress] = getDayInfo(date, false);
	if (season === "EasterWeek" && dayOfWeek > 0) {
	    document.getElementById("beginning").innerHTML = await EasterHour("nocturn", priest, full, date);
	    return
	}

	var dayData;
	try{
        var err = ""
        dayData = await getData(`${address}\\menaion\\${dateAddress}.json`);
    } catch (error) {
        console.log("No data for the day! Using the weekday troparia.")
        dayData = {"class": 0}
    }

	const nocturnData = await getData(`${address}\\horologion\\nocturn_general.json`);

	let variant = "w";
	if (season === "EasterWeek" && dayOfWeek === 0) variant = "e"
	else if (dayOfWeek === 0) variant = "sun"
	else if (dayOfWeek === 6) variant = "sat"

	document.getElementById("beginning").innerHTML = `
        <h2>${nocturnData["header"][variant]}</h2>
        <div class="rubric">${nocturnData["intro"]}</div><br>
        ${await usualBeginning(priest, season, seasonWeek, dayOfWeek)}<br><br>
        ${comeLetUs}<br><br>
        ${(await readPsalmsFromNumbers([50])).join("<br>")}<br><br>
    `;

    document.getElementById("trisagionToPater").innerHTML = trisagionToPater(priest);

    // TODO: fix this
    const isSpecialDate = false;

    if (variant === "e" || variant === "sun") {
        document.getElementById("kathisma_or_canon").innerHTML = `<div class="rubric">Appropriate canon is said here</div><br>`;
        var tropar;
        if (variant === "sun") {
            const dayOfWeekData = await getData(`${address}\\horologion\\nocturn_sun.json`);
            // verses after canon
            var gregory = `<div class="subhead">${dayOfWeekData["gregory title"]}</div><br>`;
            for (let [i, verse] of dayOfWeekData["gregory"].entries()){
                if (i === dayOfWeekData["gregory"].length - 2) gregory += `<i>${glory}<br><br></i>`;
                else if (i === dayOfWeekData["gregory"].length - 1) gregory += `<i>${andNow}<br><br></i>`;
                gregory += `${verse}<br><br>`;
            }
            gregory += `${itIsTrulyRight}<br><br>`

            document.getElementById("creed_or_gregory").innerHTML = gregory;
            tropar = `
                <div class=subhead>${dayOfWeekData["troparia"]}</div><br>
                ${(await getData(`${address}\\octoechos\\sunday_troparia_kontakia.json`))["hypakoe"][glas]}<br><br>`;
            // TODO: add optional Sunday prayer
        } else {
            // TODO: add stuff
        }
        document.getElementById("troparia_1").innerHTML = tropar;

        document.getElementById("all_hours_prayer").innerHTML = `${LHM} <FONT COLOR="RED">(40)</FONT><br><br>
            ${gloryAndNow}<br><br>`;
    } else {
        const dayOfWeekData = await getData(`${address}\\horologion\\nocturn_${variant}.json`);

        // kathisma
        const k = dayOfWeekData["kathisma"];
        document.getElementById("kathisma_or_canon").innerHTML = `
            <div class="subhead">${nocturnData["kathisma"]} ${k}</div><br>
            ${await kathismaToText(k, false, dayOfWeek, true)}<br><br>`

        // creed
        document.getElementById("creed_or_gregory").innerHTML = `
            <div class=subhead>${nocturnData["creed"]}</div><br>
            ${(await getData(`${address}\\horologion\\creed.json`))["0"]}`;

        var tropar;
        if (isSpecialDate) {
            // todo: fill in
        } else {
            tropar = `<div class=subhead>${nocturnData["troparia"][0]} ${dayOfWeekData["troparia"][0]}</div><br>
            ${dayOfWeekData["troparia"][1]}<br><br>
            <i>${glory}</i><br><br>
            ${dayOfWeekData["troparia"][2]}<br><br>
            <i>${andNow}</i><br><br>
            ${dayOfWeekData["troparia"][3]}<br><br>
            `
        }

        document.getElementById("troparia_1").innerHTML = tropar;

        document.getElementById("all_hours_prayer").innerHTML = `${LHM} <FONT COLOR="RED">(40)</FONT><br><br>
            <div class="subhead">Prayer of the hours</div><br>
            ${prayerOfTheHours}<br><br>
            ${LHM} <FONT COLOR="RED">(3)</FONT><br><br>
            ${gloryAndNow}<br><br>
            ${moreHonorable}<br><br>
            ${inTheName}<br><br>
            ${prayerBlessingMayGodBeGracious(priest, "nocturn")}<br><br>
            ${amen}<br><br>`;

        var prayer = `<div class=subhead>${nocturnData["prayer"]}</div><br>
            ${(await getData(`${address}\\horologion\\3hour.json`))["prayer"]}<br><br>`;

        if (variant === "w") {
            // TODO: re-check lenten things
            const isLenten = (
                season === "Lent" && dayOfWeek > 0 && dayOfWeek < 6
                || season === "Forelent" && seasonWeek === 3 && (dayOfWeek === 3 || dayOfWeek === 5)
                || season === "HolyWeek" && dayOfWeek > 0 && dayOfWeek <= 3
            );
            const isLessPenitential = (
                season === "Forelent" && ("forefeast" in dayData || "postfeast" in dayData)
                || dayData["class"] >= 8
            );
            if (isLenten) {
                document.getElementById("st_ephrem").innerHTML = StEphremPrayer(priest, false, isLessPenitential);
            }
        } else {
            prayer += `
                <div class=subhead>${dayOfWeekData["prayer"][0]}</div><br>
                ${dayOfWeekData["prayer"][1]}<br><br>`
        }
        document.getElementById("prayer_of_this_hour").innerHTML = prayer;

    }

}