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
    amen,
    endingBlockMinor,
    tripleAlleluia
} from './text_generation.js';
import { getDayInfo, getData, readPsalmsFromNumbers, isTriodionFeastAfterPentecost } from './script.js';
import { EasterHour } from './minor_hour.js';
import { postComplinePrayers, penitentialTroparia } from './compline.js';

const address = `Text\\English`

// TODO:
// add a choice full/not before kathisma/canon
// add a canon
// allow choice of penitential troparia on Sun
// add optional prayers
// rubrics: omit prayer for the dead
// rubrics: different troparia
// Easter Sunday nocturn
// add all canons

export function renderMidnightSkeleton() {
    return `
        <div id="beginning"></div>
        <div id="kathisma_or_canon"></div>
        <div id="creed_or_gregory"></div>
        <div id="trisagionToPater"></div>
        <div id="troparia_1"></div>
        <div id="all_hours_prayer"></div>
        <div id="st_ephrem"></div>
        <div id="prayer_of_this_hour"></div>
        <div id="psalms_2"></div>
        <div id="troparia_2"></div>
        <div id="prayer_dead"></div>
        <div id="penitential_troparia"></div>
        <div id="endingBlock"></div>
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

    var dayTriodionData
    if (
        season === "PostPentecost" && await isTriodionFeastAfterPentecost(seasonWeek, dayOfWeek)
        || season === "Pentecost" || season === "EasterWeek" || season === "HolyWeek" || season === "Lent" || season === "Forelent"
    ) {
        var weekToLookAt = seasonWeek - 1;
        if (dayOfWeek === 0 && season === "Lent") weekToLookAt = seasonWeek;
        try {
            dayTriodionData = await getData(`${address}\\triodion\\${season}\\${weekToLookAt}${dayOfWeek}.json`)
        } catch {}
    }

	const nocturnData = await getData(`${address}\\horologion\\nocturn_general.json`);

	let variant = "w";
	if (season === "EasterWeek" && dayOfWeek === 0) variant = "e"
	else if (dayOfWeek === 0) variant = "sun"
	else if (dayOfWeek === 6) variant = "sat"

	var intro = nocturnData["intro"];
	if (dayData["class"] >= 10) intro = nocturnData["vigil_note"];

	document.getElementById("beginning").innerHTML = `
        <h2>${nocturnData["header"][variant]}</h2>
        <div class="rubric">${intro}</div><br>
        ${await usualBeginning(priest, season, seasonWeek, dayOfWeek)}<br><br>
        ${comeLetUs}<br><br>
        ${(await readPsalmsFromNumbers([50])).join("<br>")}<br><br>
    `;

    document.getElementById("trisagionToPater").innerHTML = trisagionToPater(priest);

    // TODO: fix this
    const isSpecialDate = false;

    if (variant === "e" || variant === "sun") {
        // TODO: add canons
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

        document.getElementById("all_hours_prayer").innerHTML = `${LHM} <FONT COLOR="RED">(40)</FONT><br><br>`;
    } else {
        const dayOfWeekData = await getData(`${address}\\horologion\\nocturn_${variant}.json`);

        // kathisma
        const k = dayOfWeekData["kathisma"];
        document.getElementById("kathisma_or_canon").innerHTML = `
            ${await kathismaToText(k, dayOfWeek, seasonWeek, full)}<br><br>`

        // creed
        document.getElementById("creed_or_gregory").innerHTML = `
            <div class=subhead>${nocturnData["creed"]}</div><br>
            ${(await getData(`${address}\\horologion\\creed.json`))["0"]}<br><br>`;

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

        var tmp = (await readPsalmsFromNumbers(nocturnData["psalms_2"]))
        tmp[1] += "<br>";
        const psalms_2 = tmp.join("<br>");
        document.getElementById("psalms_2").innerHTML = `
            ${comeLetUs}<br><br>
            ${psalms_2}<br><br>
            ${gloryAndNow}<br><br>
            ${trisagionToPater(priest)}`;

        document.getElementById("troparia_2").innerHTML = `
            <div class=subhead>${nocturnData["troparia_2_headers"][0]}</div><br>
            ${nocturnData["troparia_2"][0]}<br><br>
            ${nocturnData["troparia_2"][1]}<br><br>
            <i>${glory}</i><br><br>
            ${nocturnData["troparia_2"][2]}<br><br>
            <i>${andNow}</i><br><br>
            ${nocturnData["troparia_2"][3]}<br><br>
            `;

        // TODO: when do we omit it?
        var prayerForTheDead = `${nocturnData["prayer_dead"]}<br><br>`;
        if (dayData["class"] >= 11) prayerForTheDead = `${nocturnData["prayer_dead_omitted"]}<br>`;
        document.getElementById("prayer_dead").innerHTML = `${LHM} <FONT COLOR="RED">(12)</FONT><br><br>${prayerForTheDead}`;
    }

    var beforeGlory = ""
    if (priest === "1" && dayOfWeek > 0) {
        // this is required on weekdays only
        beforeGlory = (await getData(`${address}\\horologion\\priestly_exclamations.json`))["Christ"] + "<br><br>";
    }
	document.getElementById("endingBlock").innerHTML = `
	    ${beforeGlory}
	    ${await endingBlockMinor(priest, dayOfWeek, "", season === "Pentecost" && (seasonWeek < 5 || seasonWeek === 5 && dayOfWeek < 4))}<br>`;

	var dayClass = dayData["class"]
    if (dayTriodionData && "class" in dayTriodionData && dayTriodionData["class"] > dayClass) dayClass = dayTriodionData["class"];
    const ekteniasData = await getData(`${address}\\horologion\\night_ektenias.json`);
    const endingData = await getData(`${address}\\horologion\\night_ending.json`);
    if (full === "1") {
        document.getElementById("penitential_troparia").innerHTML = penitentialTroparia(priest, endingData, ekteniasData);
    } else if (full === "0") {
        document.getElementById("penitential_troparia").innerHTML = "";
    }
    document.getElementById("after_prayers").innerHTML = postComplinePrayers(false, priest, endingData, ekteniasData, dayOfWeek, false, dayClass);
}

async function kathismaToText(k, dayOfWeek, seasonWeek, full) {
    var kathPsalms = (await getData(`${address}\\psalms\\kathismas.json`))[k];
    var kathPsalmsToText = "";

    if (full === "0") {
        if (dayOfWeek === 6) kathPsalms = [kathPsalms[(seasonWeek-1)%3]];
        else kathPsalms = [kathPsalms[Math.floor((dayOfWeek-1)%3)]]
    }
    var tmp;
    for (const [i, stasis] of kathPsalms.entries()){
        // tmp block to add break to psalms but not headers
        tmp = (await readPsalmsFromNumbers(stasis));
        for (var [j, el] of tmp.entries()) {if (j%2 === 1 && j < tmp.length-2) tmp[j] += "<br>"};

        kathPsalmsToText += tmp.join("<br>");
        if (i < kathPsalms.length - 1) kathPsalmsToText += "<br><br>" + tripleAlleluia
        else kathPsalmsToText += "<br><br>" + tripleAlleluia.split("<br>")[0];
        if (i < kathPsalms.length - 1) kathPsalmsToText += `${LHM} <FONT COLOR="RED">(3)</FONT><br>${gloryAndNow}<br><br>`
    }
    return kathPsalmsToText;
}