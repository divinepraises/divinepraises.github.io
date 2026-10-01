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
    tripleAlleluiaOnly,
    functionNames,
    StEphremPrayer,
    getCommonTextArray,
    giveTheBlessing,
    dismissalMajor
} from './text_generation.js';
import { getDayInfo, getData, readPsalmsFromNumbers, isTriodionFeastAfterPentecost } from './script.js';
import { EasterHour } from './minor_hour.js';
import { postComplinePrayers, penitentialTroparia, constructMenaionCanon } from './compline.js';

const address = `Text\\English`

// TODO: add all canons

export function renderMidnightSkeleton() {
    return `
        <div id="beginning"></div>
        <div id="choice"></div>
        <div id="kathisma_or_canon"></div>
        <div id="creed_or_gregory"></div>
        <div id="trisagionToPater"></div>
        <div id="sunday_troparia_selector"></div>
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
	try {
        var err = ""
        dayData = await getData(`${address}\\menaion\\${dateAddress}.json`);
    } catch (error) {
        console.log("No data for the day! Using the weekday troparia.")
        dayData = {"class": 0}
    }

    var dayTriodionData;
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

    const festalInfo = await getFestalForm(mm, dd, season, seasonWeek, dayOfWeek, dayData, dayTriodionData);

	const nocturnData = await getData(`${address}\\horologion\\nocturn_general.json`);
    const endingData = await getData(`${address}\\horologion\\night_ending.json`);
    const ekteniasData = await getData(`${address}\\horologion\\night_ektenias.json`);

	let variant = "w";
	if (season === "EasterWeek" && dayOfWeek === 0) variant = "e"
	else if (dayOfWeek === 0) variant = "sun"
	else if (dayOfWeek === 6) variant = "sat"

    var dayClass = dayData["class"]
    if (dayTriodionData && "class" in dayTriodionData && dayTriodionData["class"] > dayClass) dayClass = dayTriodionData["class"];

	var intro = nocturnData["intro"];
	if (variant === "e") {
	    intro = (await getData(`${address}\\triodion\\HolyWeek\\06_nocturn.json`))["initial note"];
	} else if (dayClass >= 10) intro = nocturnData["vigil_note"];
	if (variant === "sun") intro = `<div class="rubric">This is a preliminary version. Please submit your suggestions/corrections if any.</div><br>` + intro

	document.getElementById("beginning").innerHTML = `
        <h2>${nocturnData["header"][variant]}</h2>
        <div class="rubric">${intro}</div><br>
        ${await usualBeginning(priest, season, seasonWeek, dayOfWeek)}<br><br>
        ${comeLetUs}<br><br>
        ${(await readPsalmsFromNumbers([50])).join("<br>")}<br><br>
    `;

    document.getElementById("trisagionToPater").innerHTML = trisagionToPater(priest);

    var afterPrayers = postComplinePrayers(false, priest, endingData, ekteniasData, dayOfWeek, false, dayClass);
    if (variant === "e" || variant === "sun") {
        const dayOfWeekData = await getData(`${address}\\horologion\\nocturn_sun.json`);

        await constructCanonNocturn(dayOfWeekData, endingData, variant, glas, full, priest);

        afterPrayers += `<div class="rubric">${dayOfWeekData["prayer_rubric"]}</div><br>${dayOfWeekData["prayer"]}<br><br>`
    } else {
        await constructKathismaNocturn(nocturnData, variant, season, seasonWeek, dayOfWeek, dayData, festalInfo, priest, full);
    }

    var beforeGlory = `<div class=subhead>${nocturnData["dismissal"]}</div><br>`;
    if (priest === "1" && dayOfWeek > 0) {
        // this is required on weekdays only
        beforeGlory += (await getData(`${address}\\horologion\\priestly_exclamations.json`))["Christ"] + "<br><br>";
    }
    if (variant != "e") {
        document.getElementById("endingBlock").innerHTML = `
            ${beforeGlory}
            ${await endingBlockMinor(priest, dayOfWeek, "", season === "Pentecost" && (seasonWeek < 5 || seasonWeek === 5 && dayOfWeek < 4))}<br>`;

        document.getElementById("after_prayers").innerHTML = afterPrayers;
    }
    if (full === "1" && dayOfWeek != 0) {
        document.getElementById("penitential_troparia").innerHTML = penitentialTroparia(priest, endingData, ekteniasData);
    } else {
        document.getElementById("penitential_troparia").innerHTML = "";
    }

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
        if (i < kathPsalms.length - 1) kathPsalmsToText += `<br><br>
         ${glory}<br>
         <FONT COLOR="RED">${functionNames["choir"]}</FONT> ${andNow}<br>
         ${tripleAlleluiaOnly}<br>`
        else kathPsalmsToText += `<br><br>${gloryAndNow}`
        if (i < kathPsalms.length - 1) kathPsalmsToText += `${LHM} <FONT COLOR="RED">(3)</FONT><br>${glory}<br>
         <FONT COLOR="RED">${functionNames["reader"]}</FONT> ${andNow}<br><br>`
    }
    return kathPsalmsToText;
}

async function constructKathismaNocturn(nocturnData, variant, season, seasonWeek, dayOfWeek, dayData, festalInfo, priest, full) {
    const dayOfWeekData = await getData(`${address}\\horologion\\nocturn_${variant}.json`);
    // kathisma
    const k = dayOfWeekData["kathisma"];
    document.getElementById("kathisma_or_canon").innerHTML = `${await kathismaToText(k, dayOfWeek, seasonWeek, full)}<br><br>`

    makeFullnessSelector(dayOfWeekData["kathisma_choices"], full);

    document.getElementById("fullnessSelector").addEventListener("change", async function () {
        var instruction = document.querySelector('input[name="fullnessChoice"]:checked')?.value;
        document.getElementById("kathisma_or_canon").innerHTML = `${await kathismaToText(k, dayOfWeek, seasonWeek, instruction)}<br><br>`
    });

    // creed
    document.getElementById("creed_or_gregory").innerHTML = `
        <div class=subhead>${nocturnData["creed"]}</div><br>
        ${(await getData(`${address}\\horologion\\creed.json`))["0"]}<br><br>`;

    var tropar;
    if (festalInfo && "troparion" in festalInfo) {
        tropar = `<div class=subhead>${nocturnData["troparia"][2]}</div><br>
        ${festalInfo["troparion"]}<br><br>`
    } else {
        tropar = `<div class=subhead>${nocturnData["troparia"][0]}</div><br>
        <div class="rubric">${dayOfWeekData["troparia"][0]}</div>
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
        // st Ephrem prayer section
        // Dol does not say anything about it except that it is only 3 prostrations on the 1st day of Lent,
        // and full version for the meatfare week.
        // In Peremyshl Typicon at st John feast they apply same standard as for other offices, so I replicate it here.

        const isLenten = (
            season === "Lent" && dayOfWeek > 0 && dayOfWeek < 6
            && !(seasonWeek === 5 && dayOfWeek === 4)  // no prostrations before Great Canon
            || season === "Forelent" && seasonWeek === 3 && (dayOfWeek === 3 || dayOfWeek === 5)
            || season === "HolyWeek" && dayOfWeek > 0 && dayOfWeek <= 3
        );
        const isLessPenitential = (
            season === "Forelent" && ("forefeast" in dayData || "postfeast" in dayData)
            || dayData["class"] >= 8
        );
        const isFirstDayOfLent = (season === "Lent" && seasonWeek === 1 && dayOfWeek === 1);
        if (isLenten) {
            document.getElementById("st_ephrem").innerHTML = StEphremPrayer(priest, isFirstDayOfLent, isLessPenitential);
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

    if (festalInfo && "kontakion" in festalInfo) {
        document.getElementById("troparia_2").innerHTML = `<div class=subhead>${nocturnData["troparia"][3]}</div><br>
            ${festalInfo["kontakion"]}<br><br>`
    } else {
        document.getElementById("troparia_2").innerHTML = `
            <div class=subhead>${nocturnData["troparia_2_header"]}</div><br>
            ${nocturnData["troparia_2"][0]}<br><br>
            ${nocturnData["troparia_2"][1]}<br><br>
            <i>${glory}</i><br><br>
            ${nocturnData["troparia_2"][2]}<br><br>
            <i>${andNow}</i><br><br>
            ${nocturnData["troparia_2"][3]}<br><br>
            `;
    }

    var prayerForTheDead = `${nocturnData["prayer_dead"]}<br><br>`;
    if (festalInfo["no_prayer"]) prayerForTheDead = `${nocturnData["prayer_dead_omitted"]}<br>`;
    document.getElementById("prayer_dead").innerHTML = `${LHM} <FONT COLOR="RED">(12)</FONT><br><br>${prayerForTheDead}`;

}

function makeSundayTroparion(header, text) {
    return `<div class=subhead>${header}</div><br>${text}<br><br>`;
}

async function constructCanonNocturn(dayOfWeekData, endingData, variant, glas, full, priest) {
    if (variant === "sun") {
        let [canon, matinslike] = constructMenaionCanon(dayOfWeekData["canon"], full, glas);
        document.getElementById("kathisma_or_canon").innerHTML = canon;

        makeFullnessSelector(dayOfWeekData["canon_choices"], full)

        document.getElementById("fullnessSelector").addEventListener("change", async function () {
            var instruction = document.querySelector('input[name="fullnessChoice"]:checked')?.value;
            [canon, matinslike] = constructMenaionCanon(dayOfWeekData["canon"], instruction, glas);
            document.getElementById("kathisma_or_canon").innerHTML = canon;
        });

        // verses after canon
        var gregory = `<div class="subhead">${dayOfWeekData["gregory title"]}</div><br>`;
        for (let [i, verse] of dayOfWeekData["gregory"].entries()){
            if (i === dayOfWeekData["gregory"].length - 2) gregory += `<i>${glory}<br><br></i>`;
            else if (i === dayOfWeekData["gregory"].length - 1) gregory += `<i>${andNow}<br><br></i>`;
            gregory += `${verse}<br><br>`;
        }
        gregory += `${itIsTrulyRight}<br><br>`

        document.getElementById("creed_or_gregory").innerHTML = gregory;

        var penitentialTroparia = endingData["penitential_troparia"];
        penitentialTroparia.splice(2,0, `<i>${andNow}</i>`);
        penitentialTroparia.splice(1,0, `<i>${glory}</i>`);
        penitentialTroparia = penitentialTroparia.join("<br><br>");
        document.getElementById("troparia_1").innerHTML = makeSundayTroparion(dayOfWeekData["troparia"][0], penitentialTroparia);

        document.getElementById("sunday_troparia_selector").innerHTML = `<div class="rubric">${dayOfWeekData["troparia_selector"]}</div><br>
        <div id="SundayTropariaSelector">
          <label><input type="radio" name="troparChoice" value="penitential" id="penitential" checked>${dayOfWeekData["troparia"][0]}</label><br>
          <label><input type="radio" name="troparChoice" value="hypakoe" id="hypakoe">${dayOfWeekData["troparia"][1]}</label>
        </div><br>`

        document.getElementById("SundayTropariaSelector").addEventListener("change", async function () {
            var tropInstruction = document.querySelector('input[name="troparChoice"]:checked')?.value;
            if (tropInstruction === "penitential") {
                document.getElementById("troparia_1").innerHTML = makeSundayTroparion(dayOfWeekData["troparia"][0], penitentialTroparia);
            } else {
                const hypakoe = (await getData(`${address}\\octoechos\\sunday_troparia_kontakia.json`))["hypakoe"][glas];
                document.getElementById("troparia_1").innerHTML = makeSundayTroparion(dayOfWeekData["troparia"][1], hypakoe);
            }
        });
        document.getElementById("all_hours_prayer").innerHTML = `${LHM} <FONT COLOR="RED">(40)</FONT><br><br>`;
    } else {
        let SaturdayData = (await getData(`${address}\\triodion\\HolyWeek\\06.json`));
        let SaturdayNocturnData = (await getData(`${address}\\triodion\\HolyWeek\\06_nocturn.json`));
        let SaturdayCanon = (await getData(`${address}\\triodion\\HolyWeek\\06_matins.json`))["canon"];
        SaturdayCanon["nocturn"] = true;
        SaturdayCanon["troparia_number"] = 0;
        SaturdayCanon["repeat_hirmi"] = 1;
        let tropar = (await getData(`${address}\\triodion\\EasterWeek\\00.json`))["troparia"][1];

        let [canon, matinslike] = constructMenaionCanon(SaturdayCanon, full, 8);
        document.getElementById("kathisma_or_canon").innerHTML = canon;

        makeFullnessSelector(dayOfWeekData["canon_choices"], full)

        document.getElementById("fullnessSelector").addEventListener("change", async function () {
            var instruction = document.querySelector('input[name="fullnessChoice"]:checked')?.value;
            [canon, matinslike] = constructMenaionCanon(SaturdayCanon, instruction, 8);
            document.getElementById("kathisma_or_canon").innerHTML = canon;
        });

        document.getElementById("troparia_1").innerHTML = makeSundayTroparion(dayOfWeekData["troparia"][0], tropar);

        if (priest === "1") {
            const ekteniasData = await getData(`${address}\\horologion\\night_ektenias.json`);
            document.getElementById("all_hours_prayer").innerHTML = ekteniasData["at_compline"].join("<br><br>") + "<br>";
            let priestlyExclamationsData = await getData(`${address}\\horologion\\priestly_exclamations.json`)
            document.getElementById("endingBlock").innerHTML = `${priestlyExclamationsData["Christ"]}<br><br>
            ${glory}* ${andNow}* ${LHM} ${LHM} ${LHM}* ${giveTheBlessing(priest)}<br><br>
            ${dismissalMajor(0, 0, "", priest, true, "", [], "", SaturdayData["specialDismissal"], "")}<br><br>`
        } else {
            document.getElementById("all_hours_prayer").innerHTML = `${LHM} <FONT COLOR="RED">(40)</FONT><br><br>`;

            document.getElementById("endingBlock").innerHTML = `${glory}* ${andNow}* ${LHM} ${LHM} ${LHM}* ${giveTheBlessing(priest)}<br><br>
            ${dismissalMajor(0, 0, "", priest, true, "", [], "", SaturdayData["specialDismissal"], "")}<br><br>`
        }

        document.getElementById("after_prayers").innerHTML = `
            <div class="rubric">${SaturdayNocturnData["final note"][priest]}</div><br>
            ${SaturdayData["troparia"]} <FONT COLOR="RED">(3)</FONT><br><br>`

    }





}

function makeFullnessSelector(fullnessOptions, full) {
    document.getElementById("choice").innerHTML =  `<div id="fullnessSelector">
      <label><input type="radio" name="fullnessChoice" value="0" id="shorten">${fullnessOptions[0]}</label><br>
      <label><input type="radio" name="fullnessChoice" value="1" id="full_version">${fullnessOptions[1]}</label>
    </div><br>`
    if (full === "0") document.getElementById("shorten").checked = true;
    else document.getElementById("full_version").checked = true;
}


async function getFestalForm(mm, dd, season, seasonWeek, dayOfWeek, dayData, dayTriodionData) {
    var festalInfo = {};
    if (season === "Lent" && seasonWeek === 5 && dayOfWeek === 4) {
        // great canon
        festalInfo["kontakion"] = dayTriodionData["kontakia"];
    } else if (
        season === "Lent" && seasonWeek === 6 && dayOfWeek === 6  // Lazarus
        || season === "Pentecost" && seasonWeek === 3 && dayOfWeek === 3  // mid-50
        || season === "Pentecost" && seasonWeek === 7 && dayOfWeek === 1  // Holy Spirit Monday
    ) {
        festalInfo["troparion"] = dayTriodionData["troparia"];
        festalInfo["kontakion"] = dayTriodionData["kontakia"];
        festalInfo["no_prayer"] = true;
    } else if (
        season === "Pentecost" && seasonWeek === 4 && dayOfWeek === 3
    ) {
        // leave-taking of mid-Pentecost
        dayTriodionData = await getData(`${address}\\triodion\\${season}\\23.json`);
        festalInfo["troparion"] = dayTriodionData["troparia"];
        festalInfo["kontakion"] = dayTriodionData["kontakia"];
        festalInfo["no_prayer"] = true;
    } else if (
        season === "Pentecost" && seasonWeek === 5 && dayOfWeek === 3
    ) {
        // leave-taking of Easter
        festalInfo["troparion"] = (await getData(`${address}\\octoechos\\sunday_troparia_kontakia.json`))["troparia"][5];
        const paschalKontakion = (await getData(`${address}\\triodion\\EasterWeek\\00_hour.json`))["kontakion"];
        festalInfo["kontakion"] = `<i>(${paschalKontakion[0]})</i> ${paschalKontakion[1]}`;
        festalInfo["no_prayer"] = true;
    } else if (mm === 1 && dd === 1) {
        festalInfo["troparion"] = dayData["troparia"][1];
        festalInfo["kontakion"] = dayData["kontakia"][1];
        festalInfo["no_prayer"] = true;
    } else if (mm === 2 && dd === 2) {
        festalInfo["troparion"] = dayData["troparia"][0];
        festalInfo["kontakion"] = dayData["kontakia"][0];
        festalInfo["no_prayer"] = true;
    } else if (mm === 1 && dd === 7) {
        festalInfo["troparion"] = (await getData(`${address}\\menaion\\01\\06.json`))["troparia"];
        festalInfo["kontakion"] = dayData["kontakia"][0];
        festalInfo["no_prayer"] = true;
    } else if (mm === 12 && dd === 26) {
        festalInfo["troparion"] = (await getData(`${address}\\menaion\\12\\25.json`))["troparia"];
        festalInfo["kontakion"] = dayData["kontakia"][0];
        festalInfo["no_prayer"] = true;
    } else if (dayData["class"] === 10) {
        // Peremyshl Typicon and 1728 Lviv horologion say that on vigils of saints - if there is no vigil -
        // we say troparion and kontakion.
        // Dol. explicitly forbids using festal troparion/kontakion at Lord's/Lady's feasts with 2 exceptions.
        // So, we use festal layout only for vigils of saints.
        festalInfo["troparion"] = (await getCommonTextArray("troparia", dayData))[0];
        festalInfo["kontakion"] = (await getCommonTextArray("kontakia", dayData))[0];
        festalInfo["no_prayer"] = true;
    } else if (dayData["class"] >= 12) {
        // I feel like it makes sense to omit it on the feasts of the Lord
        festalInfo["no_prayer"] = true;
    }
    return festalInfo;
}