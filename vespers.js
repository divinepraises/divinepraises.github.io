import { StEphremPrayer, itIsTrulyRight, prayerBlessingMayGodBeGracious, inTheName, HeWhoIs, getBeginning, usualBeginning, comeLetUs ,tripleAlleluia, lesserDoxology, trisagionToPater, glory, andNow, LHM, GTL, TYL, gloryAndNow, getCommonText, moreHonorable, amen, giveTheBlessing, dismissalMajor, cross } from './text_generation.js';
import { kathismaToText, cancelPostfeastHypapante, getDayInfo, getData, isBetweenDates, readPsalmsFromNumbers, constructDayName, replaceCapsWords, specialSunday } from './script.js';
var address = `Text\\English`

// TODO readings
// TODO refactor vespers in the same way as compline so that there are two parts (vespers + presanctified/Basil or compline + ending of vespers)

const gloriaDict = {
        "g": `<i>${glory}</i>`,
        "gn": `<i>${gloryAndNow}</i>`,
        "n": `<i>${andNow}</i>`,
    }

export function renderVespersSkeleton() {
    return `
        <div id="common_part"></div>
        <br>
        <div id="ending"></div>
    `;
}

export async function enhanceVespers(priest, full, date) {
    const [year, mm, dd, season, seasonWeek, glas, dayOfWeek, dateAddress] =
        getDayInfo(date, true);

    const dayData = await getData(`${address}\\menaion\\${dateAddress}.json`);
    const vespersData = await getData(`${address}\\horologion\\general_vespers.json`);
    var vespersMenaionData = await getData(`${address}\\menaion\\${dateAddress}_vespers.json`)
    if ("postfeast" in dayData && dayData["postfeast"]==="02//02" && cancelPostfeastHypapante(dd, season, seasonWeek, dayOfWeek)) {
        delete dayData["postfeast"];
    }  else if (
        ("postfeast" in dayData && dayData["postfeast"]==="02//02" && cancelPostfeastHypapante(dd+1, season, seasonWeek+(dayOfWeek===6), (dayOfWeek+1)%7))
        || ("postfeast" in dayData && dayData["postfeast"]==="02//02" && dd === 9)
    ) {
        // leave-taking is moved to today
        dayData["class"] = 6
        dayData["troparia"] = []
        dayData["type"] = [""]
        dayData["saint"] = [""]
        dayData["name"] = [""]
        dayData["day name"] = [`Leave-taking of the ${(await getData(`${address}\\menaion\\02\\02.json`))["day name"]}`]
        const vespersMenaionDataFeast = await getData(`${address}\\menaion\\02\\02_vespers.json`);
        vespersMenaionData["ps140"] = vespersMenaionDataFeast["ps140"];
        vespersMenaionData["aposticha"] = vespersMenaionDataFeast["aposticha"];
        vespersMenaionData["aposticha_verses"] = vespersMenaionDataFeast["aposticha_verses"];
    }

    const isStBasil = (dateAddress === "12\\25" || dateAddress === "01\\06" || dateAddress === "03\\25");
    const isLenten = (season === "Lent" && dayOfWeek > 0) || (season === "Forelent" && seasonWeek === 3 && (dayOfWeek === 3 || dayOfWeek === 5));

    await vespersBeginning(
        vespersData, vespersMenaionData, full, dayOfWeek, mm, dd, glas, dayData, dateAddress, priest, season, seasonWeek, isStBasil, isLenten
    );

     if (isStBasil) {
        // this also includes a priestless case, ending like when the 24th is on weekend day
        await liturgyEnding(dayOfWeek, dayData, priest, vespersData);
    } else if (priest === "1" && season === "Lent" && (dayOfWeek === 4 || dayOfWeek === 6)) {
        //presanctifiedEnding(full, dayOfWeek, mm, dd, glas, dayData, dateAddress, priest, season);
        await vespersEnding(
            vespersData, dayOfWeek, mm, dd, glas, dayData, vespersMenaionData, priest, season, seasonWeek, isLenten
        );
    } else {
        await vespersEnding(
            vespersData, dayOfWeek, mm, dd, glas, dayData, vespersMenaionData, priest, season, seasonWeek, isLenten
        );
    }
}


async function loadTextBasil(dayOfWeek, dayData, priest, vespersData, priestlyExclamationsData) {
    const isWeekday = (dayOfWeek >= 1 && dayOfWeek <=5);
    if (priest === "1" && isWeekday) {
            return `<div class="rubric">The Liturgy of st. Basil is celebrated as usual.<br>
                The hymn to Our Lady is taken from a usual st. Basil Liturgy
                or from the 9th ode of the Compline canon that was sung the previous night (as per Dolnytsky). <br>
                 The communion hymn is of Sunday.</div><br>`;
        }
    return await makeEndingBlockMajor(priest, dayOfWeek, dayData["class"]>=8, vespersData, dayData, priestlyExclamationsData, false);
}

async function liturgyEnding(dayOfWeek, dayData, priest, vespersData) {
    var priestlyExclamationsData;
    if (priest === "1") priestlyExclamationsData = await getData(`${address}\\horologion\\priestly_exclamations.json`);
    document.getElementById("ending").innerHTML =  await loadTextBasil(dayOfWeek, dayData, priest, vespersData, priestlyExclamationsData);
}

async function vespersBeginning(vespersData, vespersMenaionData, full, dayOfWeek, mm, dd, glas, dayData, dateAddress, priest, season, seasonWeek, isStBasil, isLenten){
  const text = `
  <h2>Vespers</h2>
  <h4><div id="day_name"></div></h4>
  <div id="beginning"></div>
  <a id="#come_let_us">${comeLetUs}<br><br></a>
  <div id="psalm103Selector"></div>
  <div id="psalm103"></div><br>
  <div id="psalm103add"></div>
  ${tripleAlleluia}
  <div id="priestly_prayers_selector"></div>
  <div id="priestly_prayers"></div>
  <div id="ektenia_peace"></div><br>
  <div id="kathismaSelector"></div><br>
  <div id="kathisma"></div>
  <div id="ektenia_small"></div>
  <div id="psalms"></div><br>
  <div id="hymn_of_light"></div><br>
  <div id="prokimenon"></div><br>
  <div id="readings_selector"></div>
  <div id="readings"></div>
  <div id="ektenia_augmented_great"></div>
  <div id="lesserDoxology"></div><br>
  <div id="ektenia_supplication"></div>
  `;
  setTimeout(() => loadTextBeginning(vespersData, vespersMenaionData, full, dayOfWeek, mm, dd, season, seasonWeek, glas, dateAddress, dayData, priest, isStBasil, isLenten), 0);
  document.getElementById("common_part").innerHTML = text;
}

export async function vespersEnding(vespersData, dayOfWeek, mm, dd, glas, dayData, vespersMenaionData, priest, season, seasonWeek, isLenten){
  const text = `
  <div id="lytia_stychera"></div>
  <div id="lytia_selector"></div>
  <div id="lytia_prayers"></div>
  <div id="aposticha"></div>
  <div id="simeon"></div><br>
  ${trisagionToPater(priest)}
  <div class="subhead">Troparia</div><br>
  <div id="troparia"></div><br>
  <div id="ektenia_augmented_or_ps33"></div>
  <div id="ending_block"></div><br>
  `
  setTimeout(() => loadTextEnding(vespersData, dayOfWeek, mm, dd, season, seasonWeek, glas, dayData, vespersMenaionData, priest, isLenten), 0);

  document.getElementById("ending").innerHTML = text;
}

async function arrangeSpecialSunday(specialSundayName, mm, dd, vespersMenaionData, dayData, dayName, dayOfWeek) {
    const specialVespersData = await getData(`${address}\\menaion\\${mm}\\${specialSundayName}_vespers.json`);
    const specialDayData = await getData(`${address}\\menaion\\${mm}\\${specialSundayName}.json`);
    if (specialSundayName === "forefathers") {
        if (dayData["class"] >= 8) {
            // 3 sun, 4 forefathers, 3 saints, g forefathers
            const forefathers = specialVespersData["ps140"];
            vespersMenaionData["ps140"] = (
                forefathers.slice(0, 5)
                .concat(vespersMenaionData["ps140"].slice(0, 4))
                .concat(forefathers.slice(5, forefathers.length))
            );
            vespersMenaionData["aposticha"] = specialVespersData["aposticha"];
            dayData["troparia"] = (await getCommonText("troparia", dayData))
            dayData["troparia"].push(specialDayData["troparia"]);
            dayName = specialDayData["day name"] + " " + dayName;
            dayData["name"] = specialDayData["name"].concat(dayData["name"]);
            dayData["type"] = specialDayData["type"].concat(dayData["type"]);
        } else if (dd === 17) {
            // special case: Daniel and youths
            // 3 sun, 3 forefathers, 2 Daniel, 2 youths, g forefathers
            const forefathers = specialVespersData["ps140"];
            vespersMenaionData["ps140"] = (
                forefathers.slice(0, 4)
                .concat(vespersMenaionData["ps140"].slice(0, 3))
                .concat(vespersMenaionData["ps140"].slice(4, 7))
                .concat(forefathers.slice(5, forefathers.length))
            );
            vespersMenaionData["aposticha"] = specialVespersData["aposticha"];
            dayData["troparia"].push(specialDayData["troparia"]);
            dayName = specialDayData["day name"] + " " + dayName;
            dayData["name"] = specialDayData["name"].concat(dayData["name"]);
            dayData["type"] = specialDayData["type"].concat(dayData["type"]);
        } else {
            Object.assign(vespersMenaionData, specialVespersData);
            dayData["troparia"] = [specialDayData["troparia"]];
            dayName = specialDayData["day name"];
            dayData["name"] = specialDayData["name"];
            dayData["type"] = specialDayData["type"];
        }
    } else if (specialSundayName === "fathers") {
        dayName = specialDayData["day name"];
        dayData["name"] = specialDayData["name"];
        dayData["type"] = specialDayData["type"];
        vespersMenaionData["readings"] = specialVespersData["readings"];
        if (dd < 20) {
            vespersMenaionData["ps140"] = specialVespersData["ps140"].slice(4, 11);
            vespersMenaionData["aposticha"] = specialVespersData["aposticha"].slice(4, 7);
            dayData["troparia"] = specialDayData["troparia"];
        } else if (dd < 24){
            vespersMenaionData["ps140"] = specialVespersData["ps140"].slice(0, 13);
            vespersMenaionData["aposticha"] = specialVespersData["aposticha"];
            dayData["troparia"][0] = specialDayData["troparia"];
        } else if (dd === 24) {
            vespersMenaionData["ps140"] = (
                specialVespersData["ps140"].slice(4, 8)
                .concat(specialVespersData["ps140"].slice(0, 4))
                .concat(specialVespersData["ps140"].slice(8, 13))
            );
            vespersMenaionData["aposticha"] = specialVespersData["aposticha"];
            vespersMenaionData["aposticha_verses"] = specialVespersData["aposticha_verses"];
            dayData["troparia"].splice(0,0, specialDayData["troparia"]);
            dayData["label"] = "24";
        }
    } else if (specialSundayName === "after_nativity") {
        if (dayOfWeek === 1) {
            // transferred to Monday
            const theotokion = vespersMenaionData["ps140"][vespersMenaionData["ps140"].length-1];
            specialVespersData["ps140"].splice(4, 1)  // we don't need the last festal one
            vespersMenaionData["ps140"] = specialVespersData["ps140"];
            vespersMenaionData["ps140"].push("n")
            vespersMenaionData["ps140"].push(theotokion)

            vespersMenaionData["aposticha"] = (
                vespersMenaionData["aposticha"].slice(0, 4)
                .concat(specialVespersData["aposticha"])
            )
            dayData["troparia"] = [specialDayData["troparia"]];
        } else if (dd != 31) {
            dayName = specialDayData["day name"];
            dayData["name"] = specialDayData["name"];
            dayData["type"] = specialDayData["type"];
            Object.assign(vespersMenaionData, specialVespersData);
            dayData["troparia"] = [specialDayData["troparia"]];
        } else {
            dayName = specialDayData["day name"];
            dayData["name"] = specialDayData["name"];
            dayData["type"] = specialDayData["type"];
            vespersMenaionData["ps140"] = specialVespersData["ps140"].concat(
                ["n", "2", vespersMenaionData["ps140"][vespersMenaionData["ps140"].length-1]]
            );
            vespersMenaionData["aposticha"] = (
                specialVespersData["aposticha"].slice(0, 3)
                .concat(["4", "n", vespersMenaionData["aposticha"][8]])
            )
            dayData["troparia"] = [specialDayData["troparia"]];
            dayData["label"] = "31";
        }
    }
    return dayName;
}


async function loadTextBeginning(vespersData, vespersMenaionData, full, dayOfWeek, mm, dd, season, seasonWeek, glas, dateAddress, dayData, priest, isStBasil, isLenten) {
    var isGreatVespers = (dayData["class"] >= 8 || dayOfWeek === 0);
    const isWeekday = (dayOfWeek >= 1 && dayOfWeek <=5);

    var priestlyExclamationsData;
    if (priest === "1") priestlyExclamationsData = await getData(`${address}\\horologion\\priestly_exclamations.json`);
    var vespersTriodionData, dayTriodionData;
    const isLytia = ("lytia" in vespersMenaionData && dayData["class"] >= 10);
    var vespersOctoechosData;
    if (dayOfWeek === 0 || !isGreatVespers){
        vespersOctoechosData = await getData(`${address}\\octoechos\\${glas}\\${dayOfWeek}_vespers.json`)
    }

    if (season === "Lent" || season === "Forelent") {
        try {
            dayTriodionData = await getData(`${address}\\triodion\\${season}\\${seasonWeek-1}${dayOfWeek}.json`);
            if ("day name" in dayTriodionData) {
                if (dayOfWeek === 0 && dayData["class"] <= 6 || dayOfWeek === 6 && seasonWeek === 2) {
                    dayData["day name"] = dayTriodionData["day name"];
                } else if ("day name" in dayData && dayData["day name"] != dayTriodionData["day name"]) {
                    dayData["day name"] = dayTriodionData["day name"] + ", " + dayData["day name"];
                } else {
                    dayData["day name"] = dayTriodionData["day name"] + ", " + constructDayName(dayData, false);
                }
            }
        } catch {}
        try {
            vespersTriodionData = await getData(`${address}\\triodion\\${season}\\${seasonWeek-1}${dayOfWeek}_vespers.json`);
            if (season === "Forelent" && seasonWeek === 2 && dayOfWeek === 6) {
                // only Triodion
                Object.assign(vespersMenaionData, vespersTriodionData);
                // override Friday order
                vespersMenaionData["ps140"] = (
                    vespersMenaionData["ps140"].slice(0, 4)
                    .concat(vespersOctoechosData["ps140"])
                    .concat(vespersMenaionData["ps140"].slice(4, 7))
                    )
            } else if (season === "Forelent" && seasonWeek === 3 && dayOfWeek === 6 && dayData["class"] < 8) {
                dayData["class"] = 6
                vespersMenaionData["ps140"] = vespersTriodionData["ps140"];
            }
        } catch {}
    }

    var dayName = constructDayName(dayData, false);

    var specialSundayName;
    if (dayOfWeek === 0 || (mm === 12 && dd === 26 && dayOfWeek === 1)) specialSundayName = await specialSunday(mm, dd);
    if (specialSundayName != undefined) {
        // rewrite day data
        dayName = await arrangeSpecialSunday(specialSundayName, mm, dd, vespersMenaionData, dayData, dayName, dayOfWeek);
    }

    var vigilVespersData, haire;
    if (dayData["class"] >= 10) {
        vigilVespersData = await getData(`${address}\\horologion\\vigil_vespers.json`);
        haire = vigilVespersData["haire"];
        if (priest == "1") {
            document.getElementById("beginning").innerHTML = vigilVespersData["beginning"]+"<br><br>"
        } else {
            document.getElementById("beginning").innerHTML = getBeginning(0)+"<br><br>";
        }
    } else {
    document.getElementById("beginning").innerHTML = `
      <div class=rubric>Should vespers be said immediately after the ninth hour, omit this beginning:</div>
      <hr>
      ${usualBeginning(priest, season)}
      <hr>`
    }
     if (priest === "1" && season === "Lent" && (dayOfWeek === 4 || dayOfWeek === 6)) {
        dayName += `
            <br><br>
            <div class="rubric">
                This is NOT the Liturgy of Presanctified Gifts, but usual vespers.
                Here is how to arrange stichera for Presanctified.
                <p>There will be 10 of them, so you need to start inserting them into the verses from "Lead my soul forth from prison".
                <p> Use fist the three stichera of Aposticha (first one and its repetition counting as different).
                    Then three first stichera from ps 140. Then 4th stichera at ps140 (at "3. For with the Lord...") twice.
                    Then continiue with the stichera at ps140.
                </div>`
     }
    document.getElementById("day_name").innerHTML = dayName;

    if (isGreatVespers) {
      document.getElementById("psalm103Selector").innerHTML = `
      <label><input type="radio" name="psalm103Choice" value="verses"> Verses of psalm 103</label><br>
      <label><input type="radio" name="psalm103Choice" value="full" checked> Full psalm 103</label><br><br>`
      document.getElementById("psalm103Selector").addEventListener("change",() => makePs103(isGreatVespers));
    } else {
        document.getElementById("psalm103Selector").innerHTML = ""
    }
    makePs103(isGreatVespers);

    var ekteniaData;
    var priestPrayers;
    if (priest == "1"){
        ekteniaData = await getData(`${address}\\horologion\\ektenias.json`);
        priestPrayers = await getData(`${address}\\horologion\\vespers_priestly.json`);
        document.getElementById("priestly_prayers_selector").innerHTML = `<br>
          <label><input type="radio" name="prayersChoice" value="show"> Show the evening prayers.</label><br>
          <label><input type="radio" name="prayersChoice" value="hide" checked> Hide the evening prayers.</label>
          <br><br>`
        document.getElementById("priestly_prayers_selector").addEventListener("change",() => makePrayers(priestPrayers["light"], full, glas));
        document.getElementById("priestly_prayers").innerHTML = makePrayers(priestPrayers["light"], full, glas);

        if ("special_prokimenon_index" in vespersMenaionData && vespersMenaionData["special_prokimenon_index"] === "deceased") {
            document.getElementById("ektenia_peace").innerHTML = makeEktenia(ekteniaData["deceased"]);
        } else {
            document.getElementById("ektenia_peace").innerHTML = makeEktenia(ekteniaData["peace"]);
        }
    } else {
        document.getElementById("priestly_prayers_selector").innerHTML = "";
        document.getElementById("priestly_prayers").innerHTML = "";
        document.getElementById("ektenia_peace").innerHTML = `${LHM} <FONT COLOR="RED">(12)</FONT><br>${gloryAndNow}`;
    }

    if (isGreatVespers){
        document.getElementById("kathismaSelector").innerHTML = `
          <label><input type="radio" name="kathismaChoice" value="verses" checked> Only verses</label><br>
          <label><input type="radio" name="kathismaChoice" value="full"> Full psalms</label>
        `
    } else {
        document.getElementById("kathismaSelector").innerHTML = `
          <label><input type="radio" name="kathismaChoice" value="omit_kathisma"> Omit kathisma</label><br>
          <label><input type="radio" name="kathismaChoice" value="full_kathisma" checked> Full kathisma</label>
        `
    }

    var omit_kathisma = false;
    if ("no_kathisma" in dayData) omit_kathisma = true;
    makeKathisma(dayOfWeek, dayData["class"], mm, dd, season, priest, ekteniaData, omit_kathisma);
    document.getElementById("kathismaSelector").addEventListener("change",() => makeKathisma(dayOfWeek, dayData["class"], mm, dd, season, priest, ekteniaData, omit_kathisma));

    await makePsalm140(dayOfWeek, season, seasonWeek, glas, isGreatVespers, vespersData, vespersMenaionData, vespersOctoechosData, vespersTriodionData, dayData, specialSundayName);

    if (priest === "1"){
        var wisdom = priestlyExclamationsData["wisdom"];
    } else {
        wisdom = "";
    }

    makeHymnOfLight(priest, isGreatVespers || (vespersTriodionData != undefined && "special_prokimenon_index" in vespersTriodionData), priestPrayers, wisdom, vespersData);

    document.getElementById("prokimenon").innerHTML = await makeProkimenon(dayOfWeek, vespersData, priest, dayData, vespersMenaionData, priestlyExclamationsData, vespersTriodionData);

    if ("readings" in vespersMenaionData || vespersTriodionData != undefined && "readings" in vespersTriodionData){
        document.getElementById("readings_selector").innerHTML = `<br>
          <label><input type="radio" name="readingsChoice" value="show"> Show the insert with full readings.</label><br>
          <label><input type="radio" name="readingsChoice" value="hide" checked> Hide the insert with full readings.</label>
          <br><br>`
        document.getElementById("readings_selector").addEventListener("change",() => document.getElementById("readings").innerHTML =makeReadings(vespersTriodionData, priest, dayOfWeek, ekteniaData) + makeReadings(vespersMenaionData, priest, dayOfWeek, ekteniaData));

        document.getElementById("readings").innerHTML = makeReadings(vespersTriodionData, priest, dayOfWeek, ekteniaData) + makeReadings(vespersMenaionData, priest, dayOfWeek, ekteniaData);
    }

    if (isStBasil && priest === "1" && isWeekday) {
        document.getElementById("lesserDoxology").innerHTML = "";
    } else {
        document.getElementById("lesserDoxology").innerHTML = await lesserDoxology("vespers", season === "Lent" && dayOfWeek != 0);
    }

    if (isGreatVespers) {
        if (priest === "1" && isStBasil && isWeekday || isLenten) {
            document.getElementById("ektenia_augmented_great").innerHTML = "";
        } else if (priest === "1") {
            document.getElementById("ektenia_augmented_great").innerHTML = makeEktenia(ekteniaData["pre_augmented"], "short") + makeEktenia(ekteniaData["augmented"], "augmented") + "<br><br>";
        } else {
            document.getElementById("ektenia_augmented_great").innerHTML = `${LHM} <FONT COLOR="RED">(40)</FONT><br>${gloryAndNow}<br><br>`
        }
    }

    if (priest == "1" && isStBasil && isWeekday){
        document.getElementById("ektenia_augmented_great").innerHTML = "";
    } else if (priest === "1") {
         var ektSupp = makeEktenia(ekteniaData["supplication"], "supplication");
         document.getElementById("ektenia_supplication").innerHTML = ektSupp
         + `
         <br><br>${priestlyExclamationsData["peace"]}<br>
         ${priestlyExclamationsData["andWith"]}<br><br>
         ${priestlyExclamationsData["bow"]}<br>
         ${TYL}<br><br>
         ${priestPrayers["supplication"]}<br>
         ${amen}<br>`;
    } else {
        document.getElementById("ektenia_supplication").innerHTML = `${LHM} <FONT COLOR="RED">(12)</FONT><br>${gloryAndNow}<br>`;
    }
}


async function loadTextEnding(vespersData, dayOfWeek, mm, dd, season, seasonWeek, glas, dayData, vespersMenaionData, priest, isLenten){
    var isGreatVespers = (dayData["class"] >= 8 || dayOfWeek === 0);

    var priestlyExclamationsData;
    if (priest === "1") priestlyExclamationsData = await getData(`${address}\\horologion\\priestly_exclamations.json`);
    const isLytia = ("lytia" in vespersMenaionData && dayData["class"] >= 10);
    var dayName = constructDayName(dayData, false);

    var vespersOctoechosData = await getData(`${address}\\octoechos\\${glas}\\${dayOfWeek}_vespers.json`);
    var vespersTriodionData, dayTriodionData;
    if (season === "Lent" || season === "Forelent") {
        try {
            dayTriodionData = await getData(`${address}\\triodion\\${season}\\${seasonWeek-1}${dayOfWeek}.json`);
        } catch {}
        try {
            vespersTriodionData = await getData(`${address}\\triodion\\${season}\\${seasonWeek-1}${dayOfWeek}_vespers.json`);
            if (season === "Forelent" && seasonWeek === 2 && dayOfWeek === 6) {
                for (let key in dayData) {
                    if (!(key in dayTriodionData)) delete dayData[key]
                }
                for (let key in vespersMenaionData) {
                    if (!(key in vespersTriodionData)) delete vespersMenaionData[key]
                }
                Object.assign(vespersMenaionData, vespersTriodionData);
                Object.assign(dayData, dayTriodionData);
            } else if (season === "Forelent" && seasonWeek === 3 && dayOfWeek === 6 && dayData["class"] >= 8) {
                dayData["troparia"] = dayData["troparia"].concat(dayTriodionData["troparia"]);
            } else if (dayOfWeek === 0 && dayData["class"] <= 6 && !("forefeast" in dayData) && !("postfeast" in dayData)) {
                dayData["troparia"] = [];
            } else if (dayOfWeek === 0 && "forefeast" in dayData) {
                dayData["troparia"] = dayData["troparia"][dayData["troparia"].length-1];
            }
        } catch {}
    }

    var specialSundayName;
    if (dayOfWeek === 0 || (mm === 12 && dd === 26 && dayOfWeek === 1)) specialSundayName = await specialSunday(mm, dd);
    if (specialSundayName != undefined) {
        // rewrite day data
        dayName = await arrangeSpecialSunday(specialSundayName, mm, dd, vespersMenaionData, dayData, dayName, dayOfWeek);
    }

    var vigilVespersData, haire;
    if (dayData["class"] >= 10) {
        vigilVespersData = await getData(`${address}\\horologion\\vigil_vespers.json`);
        haire = vigilVespersData["haire"];
    }

    var ekteniaData;
    var priestPrayers;
    if (priest == "1"){
        ekteniaData = await getData(`${address}\\horologion\\ektenias.json`);
        priestPrayers = await getData(`${address}\\horologion\\vespers_priestly.json`);
        var wisdom = priestlyExclamationsData["wisdom"];
    } else {
        wisdom = "";
    }

    if (isLytia) {
        makeLytia(vespersMenaionData["lytia"], priest, vespersData, vigilVespersData, dayData, priestlyExclamationsData);
        makePs33(priest, vigilVespersData);
    } else {
        document.getElementById("lytia_stychera").innerHTML = "";
        document.getElementById("lytia_selector").innerHTML = "";
        document.getElementById("lytia_prayers").innerHTML = "";
    }

    document.getElementById("aposticha").innerHTML = await makeAposticha(glas, season, seasonWeek, dayOfWeek, isGreatVespers, dayData, vespersData, vespersMenaionData, vespersOctoechosData, vespersTriodionData);

    document.getElementById("simeon").innerHTML = `<div class="subhead">Song of Simeon</div><br>${vespersData["simeon"]}`;

    document.getElementById("troparia").innerHTML = await makeTroparia(glas, dayOfWeek, isGreatVespers, dayData, haire, specialSundayName, isLenten);

    const isSemiLenten = (season === "Forelent" && seasonWeek === 3 && dayOfWeek > 3);
    if (isLenten || isSemiLenten) {
        document.getElementById("ektenia_augmented_or_ps33").innerHTML = await makeLentenEnding(priest, season, seasonWeek, dayOfWeek, dayData["class"], ekteniaData);
    } else if (!isGreatVespers && !isLenten) {
        if (priest == "1"){
            document.getElementById("ektenia_augmented_or_ps33").innerHTML = makeEktenia(ekteniaData["augmented"], "augmented") + "<br><br>";
        } else {
            document.getElementById("ektenia_augmented_or_ps33").innerHTML = `${LHM} <FONT COLOR="RED">(40)</FONT><br>${gloryAndNow}<br><br>`;
        }
    }

    document.getElementById("ending_block").innerHTML = await makeEndingBlockMajor(priest, dayOfWeek, dayData["class"]>=8, vespersData, dayData, priestlyExclamationsData, isLenten || isSemiLenten);
}

export async function makePs33(priest, vigilVespersData){
    var text = `<div class="subhead">Blessing of the Loaves, Wine, and Oil</div><br>`;
    if (priest === "1"){
        text += vigilVespersData["blessing_of_food"].join("<br><br>") + "<br><br>"
    }
    text += vigilVespersData["blessed_be"] + ` <FONT COLOR="RED"><i>(3)</i></FONT><br><br>`
    var ps33 = (await readPsalmsFromNumbers(["33vespers"], ["Psalm 33"])).join("")

    text += ps33;
    text += "<br><br>"
    if (priest === "1"){
        text += `<FONT COLOR="RED">Priest:</FONT> ${vigilVespersData["blessing"]}<br><br><FONT COLOR="RED">Choir:</FONT> ${amen}<br><br>`
    }
    document.getElementById("ektenia_augmented_or_ps33").innerHTML = text;
}

export async function makeLytia(lytiaData, priest, vespersData, vigilVespersData, dayData, priestlyExclamationsData){
    var lytia = `<div class="subhead">Lytia</div><br>
    <div class="rubric">The first stichera is supposed to be from the lytia of the parish feast.
    Then the following sticheras are sung:</div><br>`

    var tone;
    for (let stychera of lytiaData){
        if (!isNaN(parseInt(stychera[0]))){
            // this is tone indication
            tone = stychera[0];
            lytia += `<div class="rubric">Tone ${stychera}</div>`
            continue
        }

        if (stychera in gloriaDict) {
            lytia += gloriaDict[stychera] + "<br><br>";
            continue
        }

        lytia += stychera + "<br><br>";
    }
    document.getElementById("lytia_stychera").innerHTML = lytia;

    if (priest === "0"){
        document.getElementById("lytia_selector").innerHTML = "";
        document.getElementById("lytia_prayers").innerHTML = `${LHM} <FONT COLOR="RED">(12)</FONT><br>${gloryAndNow}<br><br>
        ${vigilVespersData["greek_kyrie"]} <FONT COLOR="RED">(12)</FONT><br>${gloryAndNow}<br><br>`
    } else {
        const lytiaPrayers = vigilVespersData["lytia_prayers"];

        document.getElementById("lytia_selector").innerHTML = `
          <div class="rubric">The detailed lists of saints in square brackets are not in official books, but are included in popular books in Canada.</div>
          <div class="rubric">Family names in parentheses are given for reference, they are not supposed to be pronounced.</div><br>
          <div class="rubric">Please select your location to add local saints:</div>
          <label><input type="radio" name="countryChoice" value="canada" checked> North America.</label><br>
          <label><input type="radio" name="countryChoice" value="other"> Elsewhere.</label>
          <br><br>`
        document.getElementById("lytia_selector").addEventListener("change",() => makeLytiaPrayers(lytiaPrayers, vigilVespersData, vespersData, dayData, priestlyExclamationsData));
        makeLytiaPrayers(lytiaPrayers, vigilVespersData, vespersData, dayData, priestlyExclamationsData)
    }
}

async function makeLytiaPrayers(lytiaPrayers, vigilVespersData, vespersData, dayData, priestlyExclamationsData){
    var country = document.querySelector('input[name="countryChoice"]:checked')?.value;
    var saintNames;
    if ("TheotokosDismissal" in dayData || "specialDismissal" in dayData) saintNames = "";
    else saintNames = constructDayName(dayData, false);
    var lytia = `
        ${lytiaPrayers[0]}<br><br>
        <FONT COLOR="RED">Choir:</FONT> ${LHM} <FONT COLOR="RED">(12)</FONT><br><br>
        ${lytiaPrayers[1]}<br><br>
        <FONT COLOR="RED">Choir:</FONT> ${vigilVespersData["greek_kyrie"]} <FONT COLOR="RED">(12)</FONT><br><br>
        ${lytiaPrayers[2]}<br><br>
        <FONT COLOR="RED">Choir:</FONT> ${amen}<br><br>
        ${priestlyExclamationsData["peace"]}<br><br>
        <FONT COLOR="RED">Choir:</FONT> ${priestlyExclamationsData["andWith"]}<br><br>
        ${priestlyExclamationsData["bow"]}<br><br>
        <FONT COLOR="RED">Choir:</FONT> ${TYL}<br><br>
        ${lytiaPrayers[3]}<br><br>
        <FONT COLOR="RED">Choir:</FONT> ${amen}<br><br>
        `
        if (saintNames === "") lytia = replaceCapsWords(lytia, {"SAINT": ""});
        else {
            lytia = replaceCapsWords(lytia, {"SAINT": vigilVespersData["saint"]});
            lytia = replaceCapsWords(lytia, {"NAME": saintNames});
        }
        if (country === "other"){
            lytia = replaceCapsWords(lytia, {"LOCALVENERABLES": ""});
            lytia = replaceCapsWords(lytia, {"LOCALVENERABLEWOMEN": ""});
            lytia = replaceCapsWords(lytia, {"LOCALMARTYRS": ""});
        } else {
            let countryData = await getData(`${address}\\horologion\\${country}.json`)
            lytia = replaceCapsWords(lytia, {"LOCALVENERABLES": countryData["local_venerables"]+"<br>"});
            lytia = replaceCapsWords(lytia, {"LOCALVENERABLEWOMEN": countryData["local_venerable_women"]+"<br>"});
            lytia = replaceCapsWords(lytia, {"LOCALMARTYRS": countryData["local_martyrs"]+"<br>"});
        }
        document.getElementById("lytia_prayers").innerHTML = lytia;
}

export async function makeEndingBlockMajor(priest, dayOfWeek, isGreatVespers, vespersData, dayData, priestlyExclamationsData, isLenten){
    var res = `<div class="subhead">Dismissal</div><br>`;
    var saintNames = [constructDayName(dayData)];

    var TheotokosDismissal = "";
    if ("TheotokosDismissal" in dayData) TheotokosDismissal = dayData["TheotokosDismissal"];

    var specialDismissal = "";
    if ("specialDismissal" in dayData) specialDismissal = dayData["specialDismissal"];

    var prePostFeastData, prePostFeast;
    if (dayOfWeek != 0 && "postfeast" in dayData) {
        prePostFeast = "postfeast";
        prePostFeastData = (await getData(`${address}\\menaion\\${dayData["postfeast"]}.json`));
    }
    if (prePostFeastData && "TheotokosDismissal" in prePostFeastData) TheotokosDismissal = prePostFeastData["TheotokosDismissal"];
    if (prePostFeastData && "specialDismissal" in prePostFeastData) specialDismissal = prePostFeastData["specialDismissal"];

    if (priest === "1"){
        if ((dayOfWeek === 6 || isGreatVespers) && !isLenten) res += `
            ${priestlyExclamationsData["wisdom"]}<br><br>
            ${giveTheBlessing(priest)}<br><br>
            ${priestlyExclamationsData["blessing"]}<br><br>
            ${amen} ${vespersData["strengthen"]}<br><br>
            ${priestlyExclamationsData["theotokos"]}<br><br>
            `;
        if (!isLenten) res += `${priestlyExclamationsData["wisdom"]}<br><br>${moreHonorable}<br><br>`
        res += `${priestlyExclamationsData["Christ"]}<br><br>
            ${gloryAndNow} ${LHM} ${LHM} ${LHM} ${giveTheBlessing(priest)}<br><br>
            ${dismissalMajor(dayOfWeek, priest, isGreatVespers, prePostFeast, saintNames, TheotokosDismissal, specialDismissal)}
            `;
    } else {
        if ((dayOfWeek === 6 || dayOfWeek === 0 || isGreatVespers) && !isLenten) res += `${vespersData["strengthen"]}<br><br>`
        if (!isLenten) res += `${moreHonorable}<br><br>`
        res +=`${gloryAndNow} ${LHM} ${LHM} ${LHM} ${giveTheBlessing(priest)}<br><br>
        ${dismissalMajor(dayOfWeek, priest, isGreatVespers, prePostFeast, saintNames, TheotokosDismissal, specialDismissal)}
        `;
    }

    return res;
}

async function makeLentenEnding(priest, season, seasonWeek, dayOfWeek, dayClass, ekteniaData) {
    const lentenTexts = await getData(`${address}\\horologion\\lenten_vespers.json`);
    const lentenPrayer = lentenTexts["O heavenly King"];
    const vesperalPrayer = lentenTexts["prayer"];

    const blessedBe = (await getData(`${address}\\horologion\\vigil_vespers.json`))["blessed_be"];
    const ps33 = (await readPsalmsFromNumbers(["33vespers"], ["Psalm 33"])).join("")

    // 4 possible cases:
    // 1) full Ephrem and full conclusion (all cases except following)
    // 2) 3-prostration Ephrem and no conclusion (Sun evenings)
    // 3) no Ephrem nor conclusion (feast, Sat of Lent)
    // 4) no Ephrem and full conclusion (forelent Thu and Sat)
    const noEphrem = (
        dayOfWeek === 6
        || (season === "Forelent" && seasonWeek === 3 && dayOfWeek === 4)
        || dayClass >= 8
    )
    const smallEphrem = (season === "Lent" && dayOfWeek === 1)
    const noConclusion = (
        (season === "Lent" && dayOfWeek === 6)
        || dayOfWeek === 1
        || (dayClass >= 8 && !(season === "Forelent" && seasonWeek === 3 && dayOfWeek === 6))
    );

    var text = `<div class="subhead">Lenten conclusion</div><br>`
    if (!noEphrem) {
        text += `
            ${LHM} <FONT COLOR="RED">(40)</FONT> ${giveTheBlessing(false)}<br><br>
            ${HeWhoIs(priest)}<br><br>
            <FONT COLOR="RED">Choir:</FONT> ${amen}<br><br>
            ${lentenPrayer}<br><br>
            <FONT COLOR="RED">Choir:</FONT> ${amen}<br><br>
            ${LHM} <FONT COLOR="RED">(3)</FONT><br><br>
            ${gloryAndNow}<br><br>
            ${moreHonorable}<br><br>
            ${inTheName}<br><br>
            ${prayerBlessingMayGodBeGracious(priest, "vespers")}<br><br>
            <FONT COLOR="RED">Choir:</FONT> ${amen}<br><br>`;
    } else {
        if (priest == "1"){
            text = makeEktenia(ekteniaData["augmented"], "augmented") + "<br><br>" + text;
        } else {
            text = `${LHM} <FONT COLOR="RED">(40)</FONT><br>${gloryAndNow}<br><br>${text}`;
        }
    }
    text += StEphremPrayer(priest, smallEphrem, noEphrem);
    if (noConclusion) return text;
    return text +
            `${vesperalPrayer}<br><br>
            ${blessedBe}<FONT COLOR="RED"><i>(3)</i></FONT><br><br>
            ${ps33}<br><br>
            ${itIsTrulyRight}<br><br>`
}

export async function makeTroparia(glas, dayOfWeek, isGreatVespers, dayData, haire, specialSundayName, isLenten){
    if (isLenten) {
        const lentenTrop = (await getData(`${address}\\horologion\\lenten_vespers.json`))["troparia"];
        return replaceCapsWords(`${lentenTrop[0]}<br>
            <i>${glory}</i><br><br>
            ${lentenTrop[1]}<br>
            <i>${andNow}</i><br><br>
            ${lentenTrop[2]}<br>
            ${lentenTrop[3]}`, {"CROSS": cross});
    }
    var dayTrop;
    if ("troparia" in dayData) dayTrop = dayData["troparia"];
    else dayTrop = await getCommonText("troparia", dayData);
    if (!Array.isArray(dayTrop)) {dayTrop = [dayTrop]}

    var prePostFeast = "";
    if ("forefeast" in dayData) prePostFeast = "forefeast";
    else if ("postfeast" in dayData) prePostFeast = "postfeast";

    if (dayData["class"] > 10){
        return dayTrop[0] + `<i><FONT COLOR="RED">(3)</FONT></i>`;
    } else if (dayOfWeek === 0){
        if (dayData["class"] < 10){
            // Sunday
            dayTrop.splice(0, 0, (await getData(`${address}\\octoechos\\sunday_troparia_kontakia.json`))["troparia"][glas]);
        } else if (dayData["class"] < 12 && !("specialDismissal" in dayData)) {
            // vigil on Sunday that does not replace it
            dayTrop.splice(0, 0, `${haire}<i><FONT COLOR="RED">(${3 - dayTrop.length})</FONT></i>`);
            return dayTrop.join("<br><br>")
        } else {
            // st Basil. Dol. prescribes replacing festal troparion with Haire here because that's what menaion says
            return dayTrop[0] + `<i><FONT COLOR="RED">(2)</FONT></i><br><br>${haire}`;
        }
    } else if (dayData["class"] === 10){
        // vigil of a saint not on Sunday
        if (dayTrop.length === 1) return dayTrop[0] + `<i><FONT COLOR="RED">(2)</FONT></i><br><br>${haire}`
        else if ("specialDismissal" in dayData) return dayTrop[0] + `<i><FONT COLOR="RED">(2)</FONT></i><br><br>${dayTrop[1]}`;
        dayTrop.push(haire);
        return dayTrop.join("<br><br>")
    } else if (dayData["class"] > 10) {
        // higher vigil
        return dayTrop[0] + `<i><FONT COLOR="RED">(3)</FONT></i><br><br>`
    }

    var theotokion;
    if (
        (specialSundayName === "forefathers")
        || (prePostFeast === "forefeast" || specialSundayName === "fathers")
        || ("specialDismissal" in dayData && !isGreatVespers && dayOfWeek === 6)  // Sat for dead
        ) {
        theotokion = dayTrop[dayTrop.length-1];
        dayTrop.pop();
    } else if (prePostFeast === "postfeast") {
        theotokion = (await getData(`${address}\\menaion\\${dayData[prePostFeast]}.json`))["troparia"];
        if (Array.isArray(theotokion)) theotokion = theotokion[0];
    } else {
        // we end up here if it is not a vigil
        let tropGlas  = parseInt(dayTrop[dayTrop.length - 1].match(/\d+/)[0], 10);
        const theotokiaData = await getData(`${address}\\octoechos\\${tropGlas}\\troparia_theotokia.json`);
        if (dayOfWeek === 6 || isGreatVespers){
            theotokion = theotokiaData[0];
        } else {
            theotokion = theotokiaData[dayOfWeek];
        }
    }

    if (dayTrop.length === 1){
        return `${dayTrop}<br><br><i>${gloryAndNow}</i><br><br>${theotokion}`;
    } else if (dayTrop.length === 0){
        return `${theotokion}`;
    } else {
        var trops = "";
        for (let [i, trop] of dayTrop.entries()){
            if (i === dayTrop.length - 1) trops += `<i>${glory}</i><br><br>`
            trops += trop + "<br><br>"
        }
        return `${trops}<i>${andNow}</i><br><br>${theotokion}`;
    }
}

async function makeGloryAposticha(aposticha, vespersMenaionData, dayOfWeek) {
    var apostMen, apostVerses;
    var additionalVerses = false;
    if ("aposticha" in vespersMenaionData) apostMen = vespersMenaionData["aposticha"];
    else {
        apostMen = vespersMenaionData["additional_aposticha"]
        apostVerses = vespersMenaionData["aposticha_verses"]
        additionalVerses = true;
    }
    var foundNow = false;
    var tone;
    var i = 0;
    for (let stychera of apostMen){
        if (!isNaN(parseInt(stychera[0]))){
            // this is tone indication
            aposticha += `<div class="rubric">Tone ${stychera}</div>`;
            tone = stychera[0];
            continue
        }

        if (stychera in gloriaDict) {
            aposticha += gloriaDict[stychera] + "<br><br>";
            if (stychera === "gn" || stychera === "n") foundNow = true;
            continue
        }
        if (additionalVerses && i < apostVerses.length) {aposticha += `<i>${apostVerses[i]}</i><br><br>`; i+=1;}
        aposticha += stychera + "<br><br>";
    }
    if (!foundNow){
        if ((dayOfWeek === 3 || dayOfWeek === 5) && "stavrotheotokion_aposticha" in vespersMenaionData){
            aposticha += `<i>${andNow}</i><br><br>${vespersMenaionData["stavrotheotokion_aposticha"]}<br><br>`
        } else if ("theotokion_aposticha" in vespersMenaionData) {
            aposticha += `<i>${andNow}</i><br><br>${vespersMenaionData["theotokion_aposticha"]}<br><br>`
        } else {
            const theotokion = (await getData(`${address}\\octoechos\\${tone}\\${dayOfWeek}_vespers.json`))["aposticha"][5];
            aposticha += `<i>${andNow}</i><br><br>${theotokion}<br><br>`
        }
    }
    return aposticha
}

export async function makeAposticha(glas, season, seasonWeek, dayOfWeek, isGreatVespers, dayData, vespersData, vespersMenaionData, vespersOctoechosData, vespersTriodionData){
    var apostMain;
    var apostVerses, aposticha;

    var prePostFeast = "";

    if ("forefeast" in dayData) prePostFeast = "forefeast";
    else if ("postfeast" in dayData) prePostFeast = "postfeast";

    const useSunday = (dayOfWeek === 0 && dayData["class"] < 12 && !("label" in dayData && dayData["label"] === "24"));
    if (useSunday) {
        const versesMaterial = vespersData["prokimenon"][0];
        apostVerses = [
            `${versesMaterial[1]} ${versesMaterial[2]} ${versesMaterial[3]}`,
            versesMaterial[4],
            versesMaterial[5]
        ]
    } else if (vespersTriodionData != undefined && dayData["class"] < 11) {
        // use weekday if triodion day
        if (dayOfWeek === 6 && season === "Forelent" && seasonWeek < 3) apostVerses = vespersData["aposticha_dead"];
        else apostVerses = vespersData["aposticha"];
    } else if ("aposticha_verses" in vespersMenaionData && !("additional_aposticha" in vespersMenaionData)) apostVerses = vespersMenaionData["aposticha_verses"];
    else if (prePostFeast != "") {
        apostVerses = (await getData(`${address}\\menaion\\${dayData[prePostFeast]}_vespers.json`))["aposticha_verses"];
    } else if (dayOfWeek === 6) apostVerses = vespersData["aposticha_dead"];
    else apostVerses = vespersData["aposticha"];

    aposticha = `<div class="subhead">Aposticha</div><br>`;
    if (
        !isGreatVespers
        && prePostFeast === ""
        && (
            vespersTriodionData === undefined
            || (season === "Forelent" && seasonWeek === 2 && dayOfWeek === 6)
            )
        ) {
        // weekday or Saturday for the dead
        apostMain = vespersOctoechosData["aposticha"];
        aposticha += `
            <div class="rubric">Tone ${glas}</div>
            ${apostMain[1]}<br><br>
            <i>${apostVerses[0]}</i><br><br>
            ${apostMain[2]}<br><br>
            <i>${apostVerses[1]}</i><br><br>
            ${apostMain[3]}<br><br>
            `

        if ("aposticha" in vespersMenaionData || "additional_aposticha" in vespersMenaionData){
            aposticha = await makeGloryAposticha(aposticha, vespersMenaionData, dayOfWeek);
        } else {
            aposticha += `<i>${gloryAndNow}</i><br><br>${apostMain[5]}<br><br>`
        }
    } else if (useSunday) {
        // Sunday
        apostMain = vespersOctoechosData["aposticha"];
        aposticha += `
            <div class="rubric">Tone ${glas}</div>
            ${apostMain[1]}<br><br>
            <i>${apostVerses[0]}</i><br><br>
            ${apostMain[2]}<br><br>
            <i>${apostVerses[1]}</i><br><br>
            ${apostMain[3]}<br><br>
            <i>${apostVerses[2]}</i><br><br>
            ${apostMain[4]}<br><br>
            `

        if ("aposticha" in vespersMenaionData && (vespersTriodionData === undefined || dayData["class"] >= 8)) {
            const apostMen = vespersMenaionData["aposticha"];
            var foundGloria = false;
            var foundNow = false;
            var tone;
            for (let stychera of apostMen){
                if (!isNaN(parseInt(stychera[0]))){
                    // this is tone indication
                    tone = stychera;
                    continue
                }

                if (stychera in gloriaDict) {
                    foundGloria = true;
                    if (stychera === "gn" || stychera === "n") {
                        foundNow = true;
                    }
                    aposticha += `<div class="rubric">Tone ${tone}</div>`;
                    aposticha += gloriaDict[stychera] + "<br><br>";
                    continue
                }
                if (foundGloria) aposticha += stychera + "<br><br>";
            }
            if (!foundNow && vespersTriodionData === undefined) {
                const theotokion = (await getData(`${address}\\octoechos\\${tone}\\0_vespers.json`))["aposticha"][6];
                aposticha += `<i>${andNow}</i><br><br>${theotokion}<br><br>`
            } else if (!foundNow && vespersTriodionData != undefined) {
                aposticha += `<div class="rubric">Tone ${vespersTriodionData["aposticha"][0]}</div>`;
                const theotokion = vespersTriodionData["aposticha"][2];
                aposticha += `<i>${andNow}</i><br><br>${theotokion}<br><br>`
            }
        } else if (vespersTriodionData != undefined) {
            const tone = vespersTriodionData["aposticha"][0]
            aposticha += `<div class="rubric">Tone ${tone}</div>`;
            aposticha += `<i>${glory}</i><br><br>${vespersTriodionData["aposticha"][2]}<br><br>`;
            if (prePostFeast === "") {
                const theotokion = (await getData(`${address}\\octoechos\\${tone[0]}\\0_vespers.json`))["aposticha"][6];
                aposticha += `<i>${andNow}</i><br><br>${theotokion}<br><br>`
            } else {
                const apostMen = vespersMenaionData["aposticha"];
                aposticha += `<div class="rubric">Tone ${apostMen[apostMen.length-3]}</div>`;
                aposticha += `<i>${andNow}</i><br><br>${apostMen[apostMen.length-1]}<br><br>`
            }
        } else {
            aposticha += `<i>${gloryAndNow}</i><br><br>${apostMain[6]}<br><br>`
        }
    } else if (
            dayData["class"] < 11
            && vespersTriodionData != undefined
        ) {
        // triodion weekday
        apostMain = vespersTriodionData["aposticha"];
        aposticha += `
            <div class="rubric">Tone ${apostMain[0]}</div>
            ${apostMain[1]}<br><br>
            <i>${apostVerses[0]}</i><br><br>
            ${apostMain[1]}<br><br>
            <i>${apostVerses[1]}</i><br><br>
            ${apostMain[2]}<br><br>
            `
        if (prePostFeast != "") {
            const apostMen = vespersMenaionData["aposticha"];
            aposticha += `<div class="rubric">Tone ${apostMen[apostMen.length-3]}</div>`;
            aposticha += `<i>${gloryAndNow}</i><br><br>${apostMen[apostMen.length-1]}<br><br>`
        } else if (dayData["class"] < 8 && "aposticha" in vespersMenaionData || "additional_aposticha" in vespersMenaionData) {
            aposticha = await makeGloryAposticha(aposticha, vespersMenaionData, dayOfWeek);
        } else if (dayData["class"] >= 8 && season === "Forelent" && seasonWeek === 3 && dayOfWeek === 6) {
            // poly on Sat of cheesfare
            aposticha += `
                    <div class="rubric">Tone ${vespersMenaionData["aposticha"][0]}</div>
                    <i>${vespersMenaionData["aposticha_verses"][0]}</i><br><br>
                    ${vespersMenaionData["aposticha"][1]}<br><br>
                    <div class="rubric">Tone ${apostMain[3]}</div>
                    <i>${glory}</i><br><br>
                    ${apostMain[5]}<br><br>
                    <i>${andNow}</i><br><br>
                    ${apostMain[7]}<br><br>`;
        } else {
            let i = apostMain.length - 1;
            if (i === 2) {
                const theotokion = (await getData(`${address}\\octoechos\\${apostMain[0][0]}\\${dayOfWeek}_vespers.json`))["aposticha"][5];
                aposticha += `<i>${andNow}</i><br><br>${theotokion}<br><br>`
            } else {
                let separateGlory = false;
                while (i > 0) {
                    if (!isNaN(parseInt(apostMain[i][0]))) break;
                    if (apostMain[i] === "n") separateGlory = true;
                    i -= 1;
                }
                if (i === 0) {
                    i = 4;  // no new tone indication. stichera is at 4
                } else {
                    if (apostMain[i] != apostMain[0]) aposticha += `<div class="rubric">Tone ${apostMain[i]}</div>`;
                    // i - tone, i+1 - g/gn, i+2 - stichera
                    i += 2;
                }
                if (separateGlory) {
                    aposticha += `<i>${glory}</i>
                         ${apostMain[i]}<br><br>
                        <i>${andNow}</i><br><br>
                        ${apostMain[i+2]}<br><br>`;
                } else {
                    aposticha += `<i>${gloryAndNow}</i><br><br>
                         ${apostMain[i]}<br><br>`;
                }
            }
        }
    } else {
        // great vespers outside Sunday
        const apostMen = vespersMenaionData["aposticha"];
        var verse_i = 0;
        var foundNow = false;
        var tone;
        for (let stychera of apostMen){
            if (!isNaN(parseInt(stychera[0]))){
                // this is tone indication
                tone = stychera[0];
                aposticha += `<div class="rubric">Tone ${stychera}</div>`;
                continue
            }

            if (stychera in gloriaDict) {
                if (stychera === "gn" || stychera === "n") foundNow = true;
                aposticha += gloriaDict[stychera] + "<br><br>";
                continue
            }

            aposticha += stychera + "<br><br>";
            if (verse_i < apostVerses.length) {aposticha += `<i>${apostVerses[verse_i]}</i><br><br>`; verse_i+=1;}
        }
        if (!foundNow) {
            // assumption: can be only after Glory
            const theotokion = (await getData(`${address}\\octoechos\\${tone}\\0_vespers.json`))["aposticha"][6];
            aposticha += `<i>${andNow}</i><br><br>${theotokion}<br><br>`
        }
    }

    return aposticha
}

export function frameReadings(readings) {
    var instruction = document.querySelector('input[name="readingsChoice"]:checked')?.value;
    if (instruction != "hide" && Array.isArray(readings)) {
        var text = `<div class="subhead">Readings</div><br>
                <div class="rubric">
                    The text from Bible Gateway given below might not fully correspond to the liturgical readings,
                    as the beginnings and ends in those are usually adapted to the context.<br>
                    Note also that if a single reading consists of several passages, below it will be represented as several readings.<br>
                    We omit the dialogue with a priest and the titles of readings for the moment.<br><br>
                </div>`;
        for (let reading of readings){
            text += `
                <div class="rubric">
                    <b>${reading}</b>
                </div>
                <iframe
              src="https://www.biblegateway.com/passage/?search=${reading}&version=RSV&interface=mobile"
              width="100%"
              height="500"
              style="border: none;">
            </iframe>
            `
        }
    } else if (instruction === "hide" && Array.isArray(readings)) {
        var text = `
            <div class="subhead">Readings</div><br>
            <i>${Array.from(readings.entries().map(i => `(${1+i[0]}) ${i[1]}`)).join(", ")}</i>
            <br><br>`;
    } else {
        // just a str
        var text = `
            <div class="subhead">Readings</div><br>
            <i>${readings}</i>
            <br><br>`;
    }
    return text;
}

function makeReadings(vespersMenaionData, priest, dayOfWeek, ekteniaData) {
    if (!("readings" in vespersMenaionData)) return "";
    var text = frameReadings(vespersMenaionData["readings"]);

    if ("troparia_and_readings" in vespersMenaionData) {
        const moreReadings = vespersMenaionData["troparia_and_readings"];
        const isWeekday = (dayOfWeek >= 1 && dayOfWeek <=5);
        var i = 0;
        for (let trops of moreReadings.slice(0, 4)){
            i += 1;
            if (isNaN(parseInt(trops[0]))) { // not a tone indication-> readings
                text += frameReadings(trops);
                continue;
            }
            text += `<div class="rubric">Tone ${trops[0]}</div>`;
            text += `<div class="rubric">The troparion and verses are proclaimed by a reader or a priest.</div>`;
            text += `${trops[1]} ${trops[2]}<br><br>`
            text += `<FONT COLOR="RED">Choir:</FONT> ${trops[2]}<br><br>`
            for (let verse of trops.slice(3, trops.length)) {
                text += `<FONT COLOR="RED">v.</FONT> ${verse} <br><br><FONT COLOR="RED">Choir:</FONT> ${trops[2]}<br><br>`;
            }
            text += `<FONT COLOR="RED">v.</FONT> ${gloryAndNow} <br><br><FONT COLOR="RED">Choir:</FONT> ${trops[2]}<br><br>`;
            text += `<FONT COLOR="RED">v.</FONT> ${trops[1]} <br><br><FONT COLOR="RED">Choir:</FONT> ${trops[2]}<br><br>`
        }
        if (priest === "1") {
            text += `${makeEktenia(ekteniaData["small"])}<br><br>`;
            if (isWeekday) text += `<br><div class="rubric">Trisagion is sung here.</div><br>`;
        } else {
            text += `${LHM} <FONT COLOR="RED">(3)</FONT><br>${gloryAndNow}<br><br>`
        }

        text += `<div class="subhead">Epistle prokimenon</div><br>`;
        var trops = moreReadings[i];
        text += `<div class="rubric">Tone ${trops[0]}</div>`;
        text += `${trops[1]}* ${trops[2]}<br><br>`
        text += `<FONT COLOR="RED">Choir:</FONT> ${trops[2]}<br><br>`
        for (let verse of trops.slice(3, trops.length)) {
            text += `<FONT COLOR="RED">v.</FONT> ${verse} <br><br><FONT COLOR="RED">Choir:</FONT> ${trops[2]}<br><br>`;
        }
        text += `<FONT COLOR="RED">v.</FONT> ${trops[1]} <br><br><FONT COLOR="RED">Choir:</FONT> ${trops[2]}<br><br>`

        text += `<div class="subhead">Epistle</div><br>`;
        i += 1;
        if (isWeekday) {
            text += frameReadings(moreReadings[i][0]);
        } else {
            text += frameReadings(moreReadings[i][1]);
        }

        text += `<div class="subhead">Alleluia</div><br>`;
        i += 1;
        const alleluia = `Alleluia <FONT COLOR="RED">(3 or more, according ot the chosen melody)</FONT>`;
        trops = moreReadings[i];
        text += `<div class="rubric">Tone ${trops[0]}</div>`;
        text += `${alleluia}<br><br>`;
        for (let verse of trops.slice(1, trops.length)) {
            text += `<FONT COLOR="RED">v.</FONT> ${verse} <br><br><FONT COLOR="RED">Choir:</FONT> ${alleluia}<br><br>`;
        }

        text += `<div class="subhead">Gospel</div><br>`;
        i += 1;
        if (isWeekday) {
            text += frameReadings(moreReadings[i][0]);
        } else {
            text += frameReadings(moreReadings[i][1]);
        }
        text += "<br><br>"
    }
    if ("second_prokimenon" in vespersMenaionData) {
        text += `<div class="subhead">Prokimenon</div><br>
            ${arrangeProkimenon(vespersMenaionData["second_prokimenon"])}<br>`;
    }
    return text;
}

export function arrangeProkimenon(prokData) {
    var asterisk = "*";
    if (prokData[2] === "") asterisk = "";
    var prokimenon = `
        <div class="rubric">Tone ${prokData[0]}</div>
        <FONT COLOR="RED">Choir:</FONT> ${prokData[1]}${asterisk} ${prokData[2]}<br>`
    for (let verse of prokData.slice(3)){
        prokimenon += `<FONT COLOR="RED">v.</FONT> ${verse}<br><FONT COLOR="RED">Choir:</FONT> ${prokData[1]}${asterisk} ${prokData[2]}<br>`
    }
    if (prokData[2] != "") {
        prokimenon += `
            <FONT COLOR="RED">v.</FONT> ${prokData[1]} <br><FONT COLOR="RED">Choir:</FONT> ${prokData[2]}<br>`
    }
    return prokimenon
}

async function makeProkimenon(dayOfWeek, vespersData, priest, dayData, vespersMenaionData, priestlyExclamationsData, vespersTriodionData) {
    var prokimenon = `<div class="subhead">Prokimenon</div><br>`;
    if (priest === "1"){
        prokimenon += `
        ${priestlyExclamationsData["attentive"]}<br>
        ${priestlyExclamationsData["peace"]}<br>
        ${priestlyExclamationsData["wisdom"]}
        ${priestlyExclamationsData["stand"]}<br><br>`
    }
    var prokData;
    // Great prokimenon is used on days after great feasts, unless it's a Saturday evening when a Sunday prok is used.
    // It should be added into menaion vespers files.
    // If the feast falls on a Saturday, the great prokimenon is moved to the feast. It should be duplicated
    // in the files for now.
    if ("special_prokimenon_index" in vespersMenaionData && (
        (dayOfWeek != 0 && dayData["class"] < 12)
         || (dayData["class"] === 12 && dayOfWeek === 6))
    ) {
        prokData = (await getData(`${address}\\horologion\\special_prokimena.json`))[vespersMenaionData["special_prokimenon_index"]];
    } if (vespersTriodionData != undefined && "special_prokimenon_index" in vespersTriodionData) {
        prokData = (await getData(`${address}\\horologion\\special_prokimena.json`))[vespersTriodionData["special_prokimenon_index"]];
    } else if (vespersTriodionData != undefined && "prokimenon" in vespersTriodionData) {
        prokData = vespersTriodionData["prokimenon"];
    } else {
        prokData = vespersData["prokimenon"][dayOfWeek];
    }
    prokimenon += arrangeProkimenon(prokData);
    return prokimenon;
}

function makeHymnOfLight(priest, isGreatVespers, priestPrayers, wisdom, vespersData){
    if (!isGreatVespers || priest === "0") {
        document.getElementById("hymn_of_light").innerHTML = `
        <div class="subhead">Hymn of light</div><br>
        ${vespersData["hymn_of_light"]}`;
    } else {
         document.getElementById("hymn_of_light").innerHTML = `
         <div class="subhead">Entrance</div><br>
         ${priestPrayers["entry"]}<br>
         ${wisdom}<br><br>
         <div class="subhead">Hymn of light</div><br>
         ${vespersData["hymn_of_light"]}`;


    }
}

function countStichera(sticheras) {
    if (sticheras === undefined || !("ps140" in sticheras)) return [0, 0];
    sticheras = sticheras["ps140"];

    var numStycheras = 0;
    var numSetsStycheras = 0;

    var last_i = -1;
    for (let [i, element] of sticheras.entries()) {
        if (element in gloriaDict) {
            if (last_i === i-1){
                // prev element was the tone for glory/ glory and now
                numSetsStycheras -= 1;
            }
            break
        };
        if (typeof element === "string" && isNaN(parseInt(element[0]))) numStycheras += 1;
        if (!isNaN(parseInt(element[0]))) {numSetsStycheras += 1; last_i = i;}
    }
    return [numStycheras, numSetsStycheras]
}

async function makePsalm140(dayOfWeek, season, seasonWeek, glas, isGreatVespers, vespersData, vespersMenaionData, vespersOctoechosData, vespersTriodionData, dayData, specialSundayName){
    var prePostFeast = "";
    if ("forefeast" in dayData) prePostFeast = "forefeast";
    else if ("postfeast" in dayData) prePostFeast = "postfeast";

    const psalm140refrain = vespersData["psalm140refrain"];
    var psalm140tone = glas;
    var psalm140etc = await readPsalmsFromNumbers([140, 141, 129, 116]);

    // split by lines - to make verses or insert stichera
    var psalm140split = psalm140etc[1].split("•")
    var psalm141split = psalm140etc[3].split("•")
    var psalm129split = psalm140etc[5].split("•")
    var psalm116split = psalm140etc[7].split("•")

    // format first verses
    psalm140split[2] = (
        "<b>" + psalm140split[0].split("*")[0] + psalm140refrain + "* " + psalm140split[0] + psalm140refrain
         + "</b><br><b>" + psalm140split[1] + psalm140refrain  + "</b><br>"
         + psalm140split[2]
    )
    psalm140etc[1] = psalm140split.splice(2).join("•")

    const psalm140menaionStycheras = vespersMenaionData["ps140"];

    // decide how to arrange stychera
    var [numStycheras, numSetsMenaionStycheras] = countStichera(vespersMenaionData);
    var [numTriodionStycheras, numSetsTriodionStycheras] = countStichera(vespersTriodionData);

    var stycheraScheme;
    var stycheras;
    var psalm140OctoechosStycheras;

    var forceNumSticheras;
    if (dayOfWeek === 1 && season === "Lent" && dayData["class"] < 8) {
        psalm140tone = glas;

        var matinsStichera = (await getData(`${address}\\octoechos\\${glas}\\1_matins.json`))["aposticha"].slice(1, 3);
        if (numStycheras > 3) {
            // 2 saints: one is moved to matins
            // 6-saint: limit to 3 stichera
            if (numSetsMenaionStycheras === 2) psalm140menaionStycheras = psalm140menaionStycheras.slice(0, 4).concat(psalm140menaionStycheras.slice(numStycheras+2, numStycheras+6))
            else if (numSetsMenaionStycheras === 1) psalm140menaionStycheras = psalm140menaionStycheras.slice(0, 4).concat(psalm140menaionStycheras.slice(numStycheras+1, numStycheras+5))
        }
        stycheras = (
            vespersOctoechosData["aposticha"].slice(0, 3)
            .concat(matinsStichera)
            .concat(vespersTriodionData["ps140"])
            .concat(psalm140menaionStycheras)
        )
        stycheraScheme = Array(10).fill(1);
        numStycheras = 10;
        forceNumSticheras = 10;
    } else if (dayOfWeek > 1 && season === "Lent" && dayData["class"] < 8) {
        psalm140tone = vespersTriodionData["ps140"][0];
        stycheras = vespersTriodionData["ps140"]
        if (numStycheras > 3) {
            // 2 saints: one is moved to matins
            // 6-saint: limit to 3 stichera
            if (numSetsMenaionStycheras === 2) {
                stycheras = (
                    stycheras
                    .concat(psalm140menaionStycheras.slice(0, 4))
                    .concat(psalm140menaionStycheras.slice(numStycheras+2, numStycheras+6))
                )
            }
            else if (numSetsMenaionStycheras === 1) {
                psalm140menaionStycheras = (
                    stycheras
                    .concat(psalm140menaionStycheras.slice(0, 4))
                    .concat(psalm140menaionStycheras.slice(numStycheras+1, numStycheras+5))
                )
            }
        } else stycheras = stycheras.concat(psalm140menaionStycheras);

        stycheraScheme = Array(6).fill(1);
        numStycheras = 6;
    } else if (dayOfWeek === 0 && vespersTriodionData != undefined) {
        psalm140tone = glas;
        psalm140OctoechosStycheras = vespersOctoechosData["ps140"];

        if (dayData["class"] >= 8) {
            if (numTriodionStycheras === 4) {
                stycheras = (
                    psalm140OctoechosStycheras.slice(0, 4)
                    .concat(vespersTriodionData["ps140"].slice(0, 5))
                    .concat(psalm140menaionStycheras.slice(0, 4))
                    .concat(vespersTriodionData["ps140"].slice(5, 8))
                    )
                 stycheraScheme = Array(10).fill(1);
                 numStycheras = 10;
            } else {
                stycheraScheme = Array(3).fill(1).concat([2, 1])
                numStycheras = 3 + numTriodionStycheras + 3;
                const fourth_element = psalm140menaionStycheras[5][0];
                if (fourth_element != "g" && fourth_element != "gn" && !isNaN(parseInt(fourth_element))) {
                    // there are 4 stycheras in the first set of the saint
                    stycheras = (
                        psalm140OctoechosStycheras.slice(0, 4)
                        .concat(vespersTriodionData["ps140"].slice(0, 3))
                        .concat(psalm140menaionStycheras.slice(0, 5))
                        .concat(vespersTriodionData["ps140"].slice(3, 6))
                        )
                    stycheraScheme = stycheraScheme.concat(Array(4).fill(1));
                    numStycheras += 1;
                } else {
                    stycheras = (
                        psalm140OctoechosStycheras.slice(0, 4)
                        .concat(vespersTriodionData["ps140"].slice(0, 3))
                        .concat(psalm140menaionStycheras.slice(0, 4))
                        .concat(vespersTriodionData["ps140"].slice(3, 6))
                        )
                    stycheraScheme = stycheraScheme.concat([2, 1, 1]);
                }
            }
        } else if (prePostFeast != "") {
            // Feb 1 on Sun of Triodion
            if (numTriodionStycheras === 2) {
                stycheraScheme = Array(4).fill(1).concat([2, 1]).concat(Array(3).fill(1))
                numStycheras = 4 + numTriodionStycheras + 3;
                stycheras = (
                    psalm140OctoechosStycheras.slice(0, 5)
                    .concat(vespersTriodionData["ps140"].slice(0, 3))
                    .concat(psalm140menaionStycheras.slice(0, 4))
                    .concat(vespersTriodionData["ps140"].slice(3, 6))
                    )
                stycheraScheme = stycheraScheme.concat([2, 1]);
            } else if (numTriodionStycheras === 4) {
                stycheraScheme = Array(10).fill(1);
                numStycheras = 3 + numTriodionStycheras + 3;
                stycheras = (
                    psalm140OctoechosStycheras.slice(0, 4)
                    .concat(vespersTriodionData["ps140"].slice(0, 5))
                    .concat(psalm140menaionStycheras.slice(0, 4))
                    .concat(vespersTriodionData["ps140"].slice(5, 8))
                    )
                stycheraScheme = stycheraScheme.concat([2, 1]);
            }
        } else {
            stycheras = (
                psalm140OctoechosStycheras.slice(0, 11 - vespersTriodionData["repeat at ps140"])
                .concat(vespersTriodionData["ps140"])
            )
            if (vespersTriodionData["repeat at ps140"] === 3 && numTriodionStycheras === 2) {
                stycheraScheme = Array(7).fill(1).concat([2, 1]);
            } else if (vespersTriodionData["repeat at ps140"] === 3 && numTriodionStycheras === 3) {
                stycheraScheme = Array(10).fill(1);
            } else if (vespersTriodionData["repeat at ps140"] === 4 && numTriodionStycheras === 2) {
                stycheraScheme = Array(6).fill(1).concat([2, 2]);
            } else if (vespersTriodionData["repeat at ps140"] === 4 && numTriodionStycheras === 3) {
                stycheraScheme = Array(6).fill(1).concat([2, 1, 1]);
            } else if (vespersTriodionData["repeat at ps140"] === 4 && numTriodionStycheras === 4) {
                stycheraScheme = Array(10).fill(1);
            }
            numStycheras = 10 - vespersTriodionData["repeat at ps140"] + numTriodionStycheras;
        }
    } else if (dayOfWeek === 0 && dayData["class"] <= 11) {
        // Sunday without Lord's feast
        psalm140tone = glas;
        psalm140OctoechosStycheras = vespersOctoechosData["ps140"];
        if (prePostFeast != "" && dayData["class"] >= 8) {
            if (numStycheras === 6) {
                // 3 + 3 + 4
                // in the current data format, 0th stychera is tone
                stycheras = psalm140OctoechosStycheras.slice(0, 4).concat(psalm140menaionStycheras)
                stycheraScheme = Array(6).fill(1).concat([2, 1, 1])
                numStycheras = 9
            } else if (numStycheras === 3) {
                // 4 + 3*2 - case of Jan 11 that has no postfeast stychera
                stycheras = psalm140OctoechosStycheras.slice(0, 5).concat(psalm140menaionStycheras)
                stycheraScheme = Array(4).fill(1).concat([2, 2, 2])
                numStycheras += 4
            } else {
                stycheras = psalm140OctoechosStycheras.slice(0, 4).concat(psalm140menaionStycheras)
                stycheraScheme = Array(10).fill(1)
                numStycheras = 10
            }
        } else if (prePostFeast === "postfeast" && dayData["postfeast"] == "01//06" && "no_kathisma" in dayData) {
            // Jan 7
            stycheras = psalm140OctoechosStycheras.slice(0, 4).concat(psalm140menaionStycheras)
            // 3 + 4 + 3
            stycheraScheme = Array(3).fill(1).concat([2]).concat(Array(6).fill(1))
            numStycheras = 9
        } else if (dayData["class"] >= 8) {
            // polyeleos/vigil on Sunday
            // in the current data format, 0th stychera is tone
            if (specialSundayName === "forefathers") {
                psalm140OctoechosStycheras = psalm140OctoechosStycheras.slice(0, 4);
            } else {
                psalm140OctoechosStycheras = psalm140OctoechosStycheras.slice(0, 5);
            }
            // adding all the stycheas
            stycheras = psalm140OctoechosStycheras.concat(psalm140menaionStycheras)
            if (numStycheras === 3){
                stycheraScheme = Array(4).fill(1).concat([2, 2, 2])
            } else if (numStycheras === 4){
                stycheraScheme = Array(4).fill(1).concat([2, 2, 1, 1])
            } else if (numStycheras === 5){
                if ("specialDismissal" in dayData && numSetsMenaionStycheras === 2) {
                    // Jan 1
                    psalm140OctoechosStycheras.pop();  // to calculate total number
                    stycheras.splice(4, 1); // remove last Sunday st.
                    stycheraScheme = Array(3).fill(1).concat([2, 1, 2, 1, 1])
                } else stycheraScheme = Array(4).fill(1).concat([2, 1, 1, 1, 1])
            } else if (numStycheras >= 6) {
                stycheraScheme = Array(10).fill(1)
            }
            numStycheras += (psalm140OctoechosStycheras.length - 1);
        } else if (specialSundayName === "forefathers") {
            if (numSetsMenaionStycheras === 3){
                stycheras = psalm140OctoechosStycheras.slice(0, 4);
            } else {
                stycheras = psalm140OctoechosStycheras.slice(0, 7);
            }
            stycheras = stycheras.concat(psalm140menaionStycheras);
            stycheraScheme = Array(10).fill(1);
            numStycheras = 10;
        } else if (specialSundayName === "fathers") {
            if (numSetsMenaionStycheras === 1){
                stycheras = psalm140OctoechosStycheras.slice(0, 7);
                stycheraScheme = Array(6).fill(1).concat([2, 1, 1]);
                numStycheras = 9;
            } else if ("label" in dayData && dayData["label"] === "24") {
                stycheras = [];
                stycheraScheme = [2, 2, 2, 2, 1, 1];
                numStycheras = 6;
                psalm140tone = "6";
            } else {
                stycheras = psalm140OctoechosStycheras.slice(0, 5);
                stycheraScheme = Array(10).fill(1);
                numStycheras = 10;
            }
            stycheras = stycheras.concat(psalm140menaionStycheras);
        } else if (specialSundayName === "after_nativity") {
            stycheras = psalm140OctoechosStycheras.slice(0, 4).concat(psalm140menaionStycheras);
            stycheraScheme = Array(10).fill(1);
            numStycheras = 10;
        } else if (dayData["class"] === 6){
            if (numStycheras === 3){
                // in the current data format, 0th stychera is tone
                stycheras = psalm140OctoechosStycheras.slice(0, 7);
                // adding all the stycheas
                stycheras = stycheras.concat(psalm140menaionStycheras)
                stycheraScheme = Array(6).fill(1).concat([2, 1, 1])
                numStycheras = 9;
            } else if (numStycheras === 4){
                // in the current data format, 0th stychera is tone
                stycheras = psalm140OctoechosStycheras.slice(0, 5);
                // adding all the stycheas
                stycheras = stycheras.concat(psalm140menaionStycheras)
                stycheraScheme = Array(4).fill(1).concat([2, 2, 1, 1])
                numStycheras = 8;
            } else if (numStycheras === 6){
                // in the current data format, 0th stychera is tone
                stycheras = psalm140OctoechosStycheras.slice(0, 5);
                // adding all the stycheas
                stycheras = stycheras.concat(psalm140menaionStycheras)
                stycheraScheme = Array(10).fill(1)
                numStycheras = 10;
            }
        }
        else if (dayData["class"] === 5){
            stycheras = psalm140OctoechosStycheras.slice(0, 5);
            // adding all the stycheas
            stycheras = stycheras.concat(psalm140menaionStycheras)
            stycheraScheme = Array(10).fill(1)
            numStycheras = 10;
        }
        else if (dayData["class"] === 4){
            stycheras = psalm140OctoechosStycheras.slice(0, 8);
            // adding all the stycheas
            stycheras = stycheras.concat(psalm140menaionStycheras)
            stycheraScheme = Array(10).fill(1)
            numStycheras = 10;
        }
    } else if (!isGreatVespers && (numSetsMenaionStycheras === 2 || dayData["class"] === 6)){
        // 2 saints or a 6-saint
        psalm140tone = psalm140menaionStycheras[0][0];
        stycheras = psalm140menaionStycheras;
        if (numStycheras === 6) stycheraScheme =  Array(6).fill(1);
        else if (numStycheras === 5) stycheraScheme = [2, 1, 1, 1, 1];
        else if (numStycheras === 4){
            if (numSetsMenaionStycheras === 2) stycheraScheme = [2, 1, 2, 1];
            else stycheraScheme = [2, 2, 1, 1];
        }
        else if (numStycheras === 3) stycheraScheme =  Array(3).fill(2);
        else if (numStycheras === 2) stycheraScheme =  Array(2).fill(3);
    } else if (!isGreatVespers) {
        // one 4-saint
        numStycheras = 6;
        psalm140OctoechosStycheras = vespersOctoechosData["ps140"];
        while (psalm140OctoechosStycheras.length < 4) {
            // there are sometimes less octoechos stychera (one is tone indication, so compare to 3)
            psalm140OctoechosStycheras.splice(1, 0, psalm140OctoechosStycheras[1])
        };
        if (dayOfWeek === 6) {
            stycheras = psalm140menaionStycheras.slice(0, 4).concat(psalm140OctoechosStycheras).concat(psalm140menaionStycheras.slice(4))
        } else stycheras = psalm140OctoechosStycheras.concat(psalm140menaionStycheras);
        stycheraScheme =  Array(6).fill(1);
    } else if (vespersTriodionData != undefined && "ps140" in vespersTriodionData) {
        // great vespers in triodion
        psalm140tone = psalm140menaionStycheras[0][0];
        // find glory. we assume there is no "now"
        let iG = psalm140menaionStycheras.length - 1;
        while (iG > 0) {
            if (psalm140menaionStycheras[iG] === "g") break;
            iG -= 1;
        }
        stycheras = (
            psalm140menaionStycheras.slice(0, 4).
            concat(vespersTriodionData["ps140"].slice(0, 4)).
            concat(psalm140menaionStycheras.slice(iG, psalm140menaionStycheras.length))
        )
        stycheraScheme = Array(6).fill(1);
        numStycheras = 6;
        forceNumSticheras = 6;
    } else {
         // great vespers not on Sunday
         if ("six stichera" in vespersMenaionData) forceNumSticheras = 6;
         psalm140tone = psalm140menaionStycheras[0][0];
         stycheras = psalm140menaionStycheras;
         if (numStycheras === 2) stycheraScheme = Array(2).fill(4);
         else if (numStycheras === 3) stycheraScheme = [3, 3, 2];
         else if (numStycheras === 4) stycheraScheme = Array(4).fill(2);
         else if (numStycheras === 5) stycheraScheme = [2, 2, 2, 1, 1];
         else if (numStycheras === 6) {
            if (numSetsMenaionStycheras === 2 && prePostFeast === "") {stycheraScheme = [2, 1, 1, 2, 1, 1];}
            else if (numSetsMenaionStycheras === 2 && prePostFeast != "") {
                // the following is a workaround to avoid the repeated stychera between two psalms
                stycheras.splice(6, 0, stycheras[6]);
                numStycheras = 7;
                stycheraScheme = [1, 1, 1, 2, 1, 1, 1];
            }
            else {stycheraScheme = [2, 2, 1, 1, 1, 1];}
         }
         else if (numStycheras === 7) {stycheraScheme = [1, 1, 1, 1, 2, 1, 1];}
         else if (numStycheras > 7) stycheraScheme = Array(8).fill(1);
    }

    var i;
    var numVersesLeft;
    var currentPsalm;
    var nextPsalmList = [psalm116split];
    if (!isGreatVespers && forceNumSticheras === undefined || forceNumSticheras === 6) {
        i = 2;   // start at 2nd verse of ps 129
        numVersesLeft = 6;
        currentPsalm = psalm129split;
    } else if (dayOfWeek === 0 && dayData["class"] < 12 && forceNumSticheras === undefined || forceNumSticheras === 10) {
        i = 9;
        numVersesLeft = 10;
        currentPsalm = psalm141split;
        nextPsalmList.splice(0, 0, psalm129split);
    }
    else {i = 0; numVersesLeft = 8; currentPsalm = psalm129split;}
    // we'll be joining with no separator, so adding it to the verses with no stychera
    for (let j of Array(i).keys()) {currentPsalm[j] += "•";}
    if (i > 0) currentPsalm[i-1]+="<br><br>"

    var ns = 0;
    var lastTone = -1;
    var theotokionWasAdded = false;
    var gloryWasAdded = false;
    for (let stychera of stycheras){
        if (numVersesLeft === 2 && i > 1) {
            psalm140etc[5] = currentPsalm.join("");
            currentPsalm = nextPsalmList.shift();
            i = 0;
            }
        else if (numVersesLeft === 8 && i > 9) {
            psalm140etc[3] = currentPsalm.join("");
            currentPsalm = nextPsalmList.shift();
            i = 0;
            }

        if (!isNaN(parseInt(stychera[0]))){
            // this is tone indication
            currentPsalm.splice(i, 0, `<div class="rubric">Tone ${stychera}</div>`);
            lastTone = stychera[0];
            i += 1;
            continue
        }
        if (stychera in gloriaDict) {
            if (
                stychera === "n" && dayOfWeek === 0 && dayData["class"]<=10
                && !(specialSundayName === "fathers" && prePostFeast != "")
                && !(specialSundayName === "after_nativity" && "label" in dayData)
            ){
                // do not add a festal theotokion if it is a Sunday
                // and not Lord's/Theotokos' feast
                var lastLine = currentPsalm[currentPsalm.length-1];
                if (lastLine==="") {lastLine = currentPsalm[currentPsalm.length-2]; currentPsalm.pop();}
                // also remove tone indication if present
                if (lastLine.endsWith("div>")) {currentPsalm.pop();}
                break
            }
            if (prePostFeast != "" && stychera === "gn" && dayOfWeek === 0){
                // add festal theotokion as glory, if it is a Sunday
                stychera = "g"
            }
            if (gloryWasAdded) {
                // glory and now may have different tones.
                // this allows inserting a tone indication before "and now"
                i += 1
                if (!currentPsalm[i]) currentPsalm[i]=""
            }
            currentPsalm[i] += gloriaDict[stychera]+"<br><br>";
            if (stychera === "g" || stychera === "gn") gloryWasAdded = true;
            if (stychera === "n" || stychera === "gn") theotokionWasAdded = true;
            continue
        }

        if (ns < numStycheras){
            for (let nRep=0; nRep < stycheraScheme[ns]; nRep++){
                currentPsalm[i] = `${numVersesLeft}. <i>${currentPsalm[i]}</i><br><br>${stychera}<br><br>`;
                numVersesLeft -= 1
                i += 1
            }
            ns += 1;
        } else {
            // glory, now
            currentPsalm[i] += `${stychera}<br><br>`;
        }
    }
    if (!theotokionWasAdded) {
        if (!gloryWasAdded) currentPsalm.push(`<i>${gloryAndNow}</i><br><br>`)
        else currentPsalm.push(`<i>${andNow}</i><br><br>`)
        var theotokiaData;
        if (dayOfWeek != 0 && dayOfWeek != 6 && isGreatVespers){
            theotokiaData = await getData(`${address}\\octoechos\\${lastTone}\\stychera_theotokia.json`);
            currentPsalm.push(theotokiaData[0])
        } else if (dayOfWeek === 0 || dayOfWeek === 6){
            theotokiaData = await getData(`${address}\\octoechos\\${glas}\\stychera_theotokia.json`);
            currentPsalm.splice(currentPsalm.length-1, 0, `<br><div class="rubric">Tone ${glas}</div>`)
            currentPsalm.push(theotokiaData[0])
        } else if ((dayOfWeek === 3 || dayOfWeek === 5) && "stavrotheotokion" in vespersMenaionData) {
            currentPsalm.push(vespersMenaionData["stavrotheotokion"])
        } else if (!(dayOfWeek === 3 || dayOfWeek === 5) && "theotokion" in vespersMenaionData) {
            currentPsalm.push(vespersMenaionData["theotokion"])
        } else {
            theotokiaData = await getData(`${address}\\octoechos\\${lastTone}\\stychera_theotokia.json`);
            currentPsalm.push(theotokiaData[dayOfWeek])
        }
    }

    psalm140etc[7] = currentPsalm.join("");

    psalm140etc.splice(1, 0, `<div class="rubric">The following two verses are chanted in Tone ${psalm140tone}</div>`)
    document.getElementById("psalms").innerHTML = psalm140etc.join("");
}

function makePrayers(prayersList, full, glas){
    var instruction = document.querySelector('input[name="prayersChoice"]:checked')?.value;
    if (instruction === "hide"){document.getElementById("priestly_prayers").innerHTML = ""; return "";}
    else if (full === "1") document.getElementById("priestly_prayers").innerHTML = prayersList.join("<br><br>") + "<br><br>";
    else document.getElementById("priestly_prayers").innerHTML = prayersList[glas-1] + "<br><br>";

}

function makeSmallEktenia(priest, ekteniaData){
    // add small ektenia
    if (priest == "1"){
        document.getElementById("ektenia_small").innerHTML = makeEktenia(ekteniaData["small"]);
    } else {
        document.getElementById("ektenia_small").innerHTML = `${LHM} <FONT COLOR="RED">(3)</FONT><br>${gloryAndNow}`;
    }
    document.getElementById("ektenia_small").innerHTML += "<br><br>"
}

async function makeKathisma(dayOfWeek, dayClass, mm, dd, season, priest, ekteniaData, omit_kathisma){
    var instruction = document.querySelector('input[name="kathismaChoice"]:checked')?.value;

    if (instruction === "omit_kathisma"){
        document.getElementById("kathisma").innerHTML = "";
        document.getElementById("ektenia_small").innerHTML = "";
        return;
    }

    if (instruction === "verses"){
        var resp = await fetch(`${address}\\psalms\\1verses.txt`);
        var psalmData = await resp.text()
        document.getElementById("kathisma").innerHTML = `
        <div class="subhead">Verses of the 1st kathisma</div>
        ${psalmData}<br>
        ${tripleAlleluia.split("<br>")[1]}<br>`;
        makeSmallEktenia(priest, ekteniaData);
        return;
    }

    // TODO: cancel kathisma if yesterday was a vigil
    // TODO: 5th week of Lent
    // placeholder, and all teh code is in place:
    const fifthWeekOfLent = 0;
    // TODO: psalms instead of numbers

    // Dol. Typicon does not specify the order of kathismas, but in section on the lowest ranks of days, in a footnote,
    // he tells to take the order from the psalter.
    // The order here is from Psalter (Lviv, 1901) given at the web-page of the Liturgical Commission of UGCC.

    // there are long and short schemes.
    // in long one, there are 3 kathismas at Matins, and k 18 at weekday vespers
    // in short one, vespers kathisma is variable
    // The long one is used:
    // 1) [Sunday after leave-taking of Exaltation of the Cross, Dec 10] and
    // 2) [Jan 15, Saturday before the Sunday of Prodigal Som]
    // The short one is used the rest of the Year except Lent and Holy week
    // In Lent and Holy week, kathisma 18 is used too at vespers, except  5th week of Lent, when it's a different
    // schedule

    if (dayClass === 12 && dayOfWeek >= 2) {
      document.getElementById("kathisma").innerHTML = `<div class=\"rubric\">No kathisma on Lord's feasts</div><br>`;
      document.getElementById("kathismaSelector").innerHTML = "";
      return
    }

    if ((dayOfWeek === 1 && dayClass < 12) || omit_kathisma) {
      document.getElementById("kathisma").innerHTML = `<div class=\"rubric\">No kathisma on Sunday night and after vigil-ranked feasts.</div><br>`;
      document.getElementById("kathismaSelector").innerHTML = "";
      return
    }

    var k;
    const isGreatVespers = (dayClass >= 8);
    const long_scheme = (
        (season === "Lent")
        || (season === "Forelent")
        || (
            (season === "0") && (
                isBetweenDates(mm, dd, 9, 28, 12, 10)  // after the week after leave taking of Exaltation
                ||isBetweenDates(mm, dd, 1, 15, 3, 15)  // from jan 15 to a random date that is surely in Lent
                ||(isBetweenDates(mm, dd, 9, 22, 9, 27) && dd > dayOfWeek+21)  // after Sun after leave-taking of Exaltation
           )
        )
    );

    if (fifthWeekOfLent) {
        if (dayOfWeek === 0) k = 1;
        else if (dayOfWeek === 2) k = 10;
        else if (dayOfWeek === 3) k = 19;
        else if (dayOfWeek === 4) k = 7;
        else if (dayOfWeek === 5) k = 12;
        else if (dayOfWeek === 6) k = 18;
    } else {
        if (dayOfWeek === 0 || isGreatVespers) k = 1;
        else if (dayOfWeek === 6 || long_scheme) k = 18;
        else if (dayOfWeek === 2) k = 6;
        else if (dayOfWeek === 3) k = 9;
        else if (dayOfWeek === 4) k = 12;
        else if (dayOfWeek === 5) k = 15;
    }

    const kathPsalmsToText = await kathismaToText(k, isGreatVespers, dayOfWeek);
    if (isGreatVespers && dayOfWeek != 0){
      document.getElementById("kathisma").innerHTML = `<div class="subhead">First stasis of Kathisma ${k}</div>${kathPsalmsToText}<br>`
    } else {
      document.getElementById("kathisma").innerHTML = `<div class="subhead">Kathisma ${k}</div>${kathPsalmsToText}<br>`;
    }

    makeSmallEktenia(priest, ekteniaData);
}

export function makeEktenia(ekteniaData, key=false){
    var ektenia = "<FONT COLOR=\"RED\">Deacon: </FONT>";
    var num_petitions = ekteniaData.length - 2;

    for (const [index, petition] of ekteniaData.entries()){
        if (!(key==="supplication" || key==="augmented") && index < num_petitions) ektenia += `<b>${petition}</b><br>${LHM}<br><br>`;
        else if (key==="short") ektenia += `<b>${petition}</b><br>${LHM}<br><br>`;
        else if (key==="augmented" && index < num_petitions) ektenia += `<b>${petition}</b><br>${LHM} <FONT COLOR="RED">(3)</FONT><br><br>`;
        else if (key==="supplication" && index < 2) ektenia += `<b>${petition}</b><br>${LHM}<br><br>`;
        else if (index === num_petitions) ektenia += `<b>${petition}</b><br>${TYL}<br><br>`;
        else if (index === num_petitions + 1) ektenia += `<FONT COLOR="RED">Priest: </FONT><b>${petition}</b><br>${amen}`;
        else if (key==="supplication") ektenia += `<b>${petition}</b><br>${GTL}<br><br>`;
    }
    return ektenia;
}

async function makePs103(great){
    var instruction = document.querySelector('input[name="psalm103Choice"]:checked')?.value;
    if (!great) instruction = "full";
    if (instruction === "full") {
        var resp = await fetch(`${address}\\psalms\\103.txt`);
        var psalmData = await resp.text()
        document.getElementById("psalm103").innerHTML = `<div class="subhead">Psalm 103</div>${psalmData}<br>`;

        resp = await fetch(`${address}\\psalms\\103add.txt`);
        psalmData = await resp.text()
        document.getElementById("psalm103add").innerHTML = psalmData + "<br><br>";
    } else {
        var resp = await fetch(`${address}\\psalms\\103verses.txt`);
        var psalmData = await resp.text()
        document.getElementById("psalm103").innerHTML = `<div class="subhead">Psalm 103 verses</div>${psalmData}`;
        document.getElementById("psalm103add").innerHTML = "";
    }
}