import { getBeginning, usualBeginning, comeLetUs ,tripleAlleluia, lesserDoxology, trisagionToPater, glory, andNow, LHM, GTL, TYL, gloryAndNow, getCommonText, moreHonorable, amen, giveTheBlessing, dismissalMajor } from './text_generation.js';
import { getDayInfo, getData, isBetweenDates, readPsalmsFromNumbers, constructDayName, replaceCapsWords } from './script.js';
var address = `Text\\English`

// TODO readings

const gloriaDict = {
        "g": `<i>${glory}</i>`,
        "gn": `<i>${gloryAndNow}</i>`,
        "n": `<i>${andNow}</i>`,
    }

export async function vespers(priest, full, date){
	let [year, mm, dd, season, glas, dayOfWeek, dateAddress] = getDayInfo(date, true);

    var dayData;
	try{
        dayData = await getData(`${address}\\menaion\\${dateAddress}.json`);
    } catch (error) {
        dayData = {"class" : 0};
        return `No data for this day! ${`${address}\\menaion\\${dateAddress}.json`}`
    }

    return dailyVespers(full, dayOfWeek, mm, dd, glas, dayData, dateAddress, priest, season);
}

function dailyVespers(full, dayOfWeek, mm, dd, glas, dayData, dateAddress, priest, season){
  loadTextDaily(full, dayOfWeek, mm, dd, season, glas, dateAddress, dayData, priest);
  return `
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
  <div id="readings"></div>
  <div id="ektenia_augmented_great"></div>
  <div id="lesserDoxology"></div><br>
  <div id="ektenia_supplication"></div><br>
  <div id="lytia_stychera"></div>
  <div id="lytia_selector"></div>
  <div id="lytia_prayers"></div>
  <div id="aposticha"></div>
  <div id="simeon"></div><br>
  ${trisagionToPater(priest)}
  <div id="troparia"></div><br>
  <div id="ektenia_augmented_or_ps33"></div>
  <div id="ending_block"></div><br>
  `
}

async function loadTextDaily(full, dayOfWeek, mm, dd, season, glas, dateAddress, dayData, priest){
    var isGreatVespers = (dayData["class"] >= 8 || dayOfWeek === 0);

    const vespersData = await getData(`${address}\\horologion\\general_vespers.json`)
    const vespersMenaionData = await getData(`${address}\\menaion\\${dateAddress}_vespers.json`)
    const isLytia = ("lytia" in vespersMenaionData && dayData["class"] >= 10);

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

    const dayName = constructDayName(dayData, false)
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

        document.getElementById("ektenia_peace").innerHTML = makeEktenia(ekteniaData["peace"]);
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

    makeKathisma(dayOfWeek, isGreatVespers, mm, dd, season, priest, ekteniaData);
    document.getElementById("kathismaSelector").addEventListener("change",() => makeKathisma(dayOfWeek, isGreatVespers, mm, dd, season, priest, ekteniaData));

    var vespersOctoechosData;
    if (dayOfWeek === 0 || !isGreatVespers){
        vespersOctoechosData = await getData(`${address}\\octoechos\\${glas}\\${dayOfWeek}_vespers.json`)
    }

    await makePsalm140(dayOfWeek, glas, isGreatVespers, vespersData, vespersMenaionData, vespersOctoechosData, dayData);

    if (priest === "1"){
        var wisdom = vespersData["wisdom"];
    } else {
        wisdom = "";
    }

    makeHymnOfLight(priest, isGreatVespers, priestPrayers, wisdom, vespersData);

    document.getElementById("prokimenon").innerHTML = await makeProkimenon(dayOfWeek, vespersData, priest);

    if ("readings" in vespersMenaionData){
        document.getElementById("readings").innerHTML = `
        <div class="subhead">Readings</div><br>
        <i>${vespersMenaionData["readings"]}</i>
        <br><br>`
    }

    document.getElementById("lesserDoxology").innerHTML = await lesserDoxology("vespers");

    var augmentedName;
    if (isGreatVespers || isLytia) augmentedName = "ektenia_augmented_great";
    else augmentedName = "ektenia_augmented_or_ps33";

    if (priest == "1"){
         var ektSupp = makeEktenia(ekteniaData["supplication"], "supplication");
         document.getElementById("ektenia_supplication").innerHTML = ektSupp
         + `
         <br><br>${vespersData["peace"]}<br>
         ${vespersData["andWith"]}<br><br>
         ${vespersData["bow"]}<br>
         ${TYL}<br><br>
         ${priestPrayers["supplication"]}<br>
         ${amen}`;
    } else  {
        document.getElementById("ektenia_supplication").innerHTML = `${LHM} <FONT COLOR="RED">(12)</FONT><br>${gloryAndNow}`;
    }

    if (isLytia){
        makeLytia(vespersMenaionData["lytia"], priest, vespersData, vigilVespersData, dayName);
        makePs33(priest, vigilVespersData);
    } else {
        document.getElementById("lytia_stychera").innerHTML = "";
        document.getElementById("lytia_selector").innerHTML = "";
        document.getElementById("lytia_prayers").innerHTML = "";
    }

    document.getElementById("aposticha").innerHTML = await makeAposticha(glas, dayOfWeek, isGreatVespers, dayData, vespersData, vespersMenaionData, vespersOctoechosData);

    document.getElementById("simeon").innerHTML = `<div class="subhead">Song of Simeon</div><br>${vespersData["simeon"]}`;

    document.getElementById("troparia").innerHTML = await makeTroparia(glas, dayOfWeek, isGreatVespers, dayData, haire);

    if (priest == "1"){
        if (isGreatVespers) {
            document.getElementById(augmentedName).innerHTML = makeEktenia(ekteniaData["pre_augmented"], "short") + makeEktenia(ekteniaData["augmented"], "augmented") + "<br><br>";
        } else {
            document.getElementById(augmentedName).innerHTML = makeEktenia(ekteniaData["augmented"], "augmented") + "<br><br>";
        }
    } else {
        document.getElementById(augmentedName).innerHTML = `${LHM} <FONT COLOR="RED">(40)</FONT><br>${gloryAndNow}<br><br>`;
    }

    document.getElementById("ending_block").innerHTML = await makeEndingBlockMajor(priest, dayOfWeek, dayData["class"]>=8, vespersData, dayData);
}

async function makePs33(priest, vigilVespersData){
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

async function makeLytia(lytiaData, priest, vespersData, vigilVespersData, saintNames){
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
        document.getElementById("lytia_selector").addEventListener("change",() => makeLytiaPrayers(lytiaPrayers, vigilVespersData, vespersData, saintNames));
        makeLytiaPrayers(lytiaPrayers, vigilVespersData, vespersData, saintNames)
    }
}

async function makeLytiaPrayers(lytiaPrayers, vigilVespersData, vespersData, saintNames){
    var country = document.querySelector('input[name="countryChoice"]:checked')?.value;
    var lytia = `
        ${lytiaPrayers[0]}<br><br>
        <FONT COLOR="RED">Choir:</FONT> ${LHM} <FONT COLOR="RED">(12)</FONT><br><br>
        ${lytiaPrayers[1]}<br><br>
        <FONT COLOR="RED">Choir:</FONT> ${vigilVespersData["greek_kyrie"]} <FONT COLOR="RED">(12)</FONT><br><br>
        ${lytiaPrayers[2]}<br><br>
        <FONT COLOR="RED">Choir:</FONT> ${amen}<br><br>
        ${vespersData["peace"]}<br><br>
        <FONT COLOR="RED">Choir:</FONT> ${vespersData["andWith"]}<br><br>
        ${vespersData["bow"]}<br><br>
        <FONT COLOR="RED">Choir:</FONT> ${TYL}<br><br>
        ${lytiaPrayers[3]}<br><br>
        <FONT COLOR="RED">Choir:</FONT> ${amen}<br><br>
        `
        lytia = replaceCapsWords(lytia, {"SAINT": vigilVespersData["saint"]});
        lytia = replaceCapsWords(lytia, {"NAME": saintNames});
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

async function makeEndingBlockMajor(priest, dayOfWeek, isGreatVespers, vespersData, dayData){
    var res = `<div class="subhead">Dismissal</div><br>`;
    var saintNames = [constructDayName(dayData)];

    var TheotokosDismissal = "";
    if ("TheotokosDismissal" in dayData) TheotokosDismissal = dayData["TheotokosDismissal"];

    var prePostFeastData, prePostFeast;
    if (dayOfWeek != 0 && "postfeast" in dayData) {
        prePostFeast = "postfeast";
        prePostFeastData = (await getData(`${address}\\menaion\\${dayData["postfeast"]}.json`));
    }
    if (prePostFeastData && "TheotokosDismissal" in prePostFeastData) TheotokosDismissal = prePostFeastData["TheotokosDismissal"];

    if (priest === "1"){
        res += `${vespersData["wisdom"]}<br><br>`
        if (dayOfWeek === 6 || isGreatVespers) res += `
            ${giveTheBlessing(priest)}<br><br>
            ${vespersData["blessing"]}<br><br>
            ${amen} ${vespersData["strengthen"]}<br><br>
            ${vespersData["theotokos"]}<br><br>
            `;

        res += `${moreHonorable}<br><br>
            ${vespersData["Christ"]}<br><br>
            ${gloryAndNow} ${LHM} ${LHM} ${LHM} ${giveTheBlessing(priest)}<br><br>
            ${dismissalMajor(dayOfWeek, priest, isGreatVespers, prePostFeast, saintNames, TheotokosDismissal)}
            `;
    } else {
        if (dayOfWeek === 6 || isGreatVespers) res += `${vespersData["strengthen"]}<br><br>`
        res +=`${moreHonorable}<br><br>
        ${gloryAndNow} ${LHM} ${LHM} ${LHM} ${giveTheBlessing(priest)}<br><br>
        ${dismissalMajor(dayOfWeek, priest, isGreatVespers, prePostFeast, saintNames, TheotokosDismissal)}
        `;
    }

    return res;
}


async function makeTroparia(glas, dayOfWeek, isGreatVespers, dayData, haire){
    // TODO Lent
    var dayTrop;
    if ("troparia" in dayData) dayTrop = dayData["troparia"];
    else dayTrop = await getCommonText("troparia", dayData);
    if (!Array.isArray(dayTrop)) {dayTrop = [dayTrop]}

    var prePostFeast = "";
    if ("forefeast" in dayData) prePostFeast = "forefeast";
    else if ("postfeast" in dayData) prePostFeast = "postfeast";

    if (dayOfWeek === 0){
        if (dayData["class"] < 10){
            // Sunday
            dayTrop.splice(0, 0, (await getData(`${address}\\octoechos\\sunday_troparia_kontakia.json`))["troparia"][glas]);
        } else if (dayData["class"] < 12){
            // vigil on Sunday that does not replace it
            dayTrop.splice(0, 0, `${haire}<i><FONT COLOR="RED">(${3 - dayTrop.length})</FONT></i>`);
            return dayTrop.join("<br><br>")
        }
    } else if (dayData["class"] === 10){
        // vigil of a saint not on Sunday
        if (dayTrop.length === 1) return dayTrop[0] + `<i><FONT COLOR="RED">(2)</FONT></i><br><br>${haire}`
        dayTrop.push(haire);
        return dayTrop.join("<br><br>")
    } else if (dayData["class"] > 10) {
        // higher vigil
        return dayTrop[0] + `<i><FONT COLOR="RED">(3)</FONT></i><br><br>`
    }

    var theotokion;
    if (prePostFeast === "forefeast"){
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
        return `<div class="subhead">Troparia</div><br>${dayTrop}<br><br><i>${gloryAndNow}</i><br><br>${theotokion}`;
    } else {
        var trops = "";
        for (let [i, trop] of dayTrop.entries()){
            if (i === dayTrop.length - 1) trops += `<i>${glory}</i><br><br>`
            trops += trop + "<br><br>"
        }
        return `<div class="subhead">Troparia</div><br>${trops}<i>${andNow}</i><br><br>${theotokion}`;
    }
}


async function makeAposticha(glas, dayOfWeek, isGreatVespers, dayData, vespersData, vespersMenaionData, vespersOctoechosData){
    // TODO triodion
    var apostMain;
    var apostVerses, aposticha;

    var prePostFeast = "";

    if ("forefeast" in dayData) prePostFeast = "forefeast";
    else if ("postfeast" in dayData) prePostFeast = "postfeast";

    if (dayOfWeek === 0 && dayData["class"] < 12) {
        const versesMaterial = vespersData["prokimenon"][0];
        apostVerses = [
            `${versesMaterial[1]} ${versesMaterial[2]} ${versesMaterial[3]}`,
            versesMaterial[4],
            versesMaterial[5]
        ]
    } else if ("aposticha_verses" in vespersMenaionData) apostVerses = vespersMenaionData["aposticha_verses"];
    else if (prePostFeast != "") {
        apostVerses = (await getData(`${address}\\menaion\\${dayData[prePostFeast]}_vespers.json`))["aposticha_verses"];
    } else if (dayOfWeek === 6) apostVerses = vespersData["aposticha_dead"];
    else apostVerses = vespersData["aposticha"];

    aposticha = `<div class="subhead">Aposticha</div><br>`;
    if (!isGreatVespers && prePostFeast === ""){
        // weekday
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
            var apostMen;
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
        } else {
            aposticha += `<i>${gloryAndNow}</i><br><br>${apostMain[5]}<br><br>`
        }
    } else if (dayOfWeek === 0 && dayData["class"] < 12) {
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

        if ("aposticha" in vespersMenaionData){
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
                    if (stychera === "gn") foundNow = true;
                    aposticha += `<div class="rubric">Tone ${tone}</div>`;
                    aposticha += gloriaDict[stychera] + "<br><br>";
                    continue
                }
                if (foundGloria) aposticha += stychera + "<br><br>";
            }
            if (!foundNow) {
                const theotokion = (await getData(`${address}\\octoechos\\${tone}\\0_vespers.json`))["aposticha"][6];
                aposticha += `<i>${andNow}</i><br><br>${theotokion}<br><br>`
            }
        } else {
            aposticha += `<i>${gloryAndNow}</i><br><br>${apostMain[6]}<br><br>`
        }

    }
    else {
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


async function makeProkimenon(dayOfWeek, vespersData, priest){
    // TODO great prokimena
    var prokimenon = `<div class="subhead">Prokimenon</div><br>`;
    if (priest === "1"){
        prokimenon += `
        ${vespersData["attentive"]}<br>
        ${vespersData["peace"]}<br>
        ${vespersData["wisdom"]}
        ${vespersData["stand"]}<br><br>`
    }
    const prokData = vespersData["prokimenon"][dayOfWeek];
    prokimenon += `
        <div class="rubric">Tone ${prokData[0]}</div>
        <FONT COLOR="RED">Choir:</FONT> ${prokData[1]}* ${prokData[2]}<br>`
    for (let verse of prokData.slice(3)){
        prokimenon += `<FONT COLOR="RED">v.</FONT> ${verse}<br><FONT COLOR="RED">Choir:</FONT> ${prokData[1]}* ${prokData[2]}<br>`
    }
    prokimenon += `
        <FONT COLOR="RED">v.</FONT> ${prokData[1]} <br><FONT COLOR="RED">Choir:</FONT> ${prokData[2]}<br>`
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

async function makePsalm140(dayOfWeek, glas, isGreatVespers, vespersData, vespersMenaionData, vespersOctoechosData, dayData){
    // TODO triodion

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
    var numStycheras = 0;
    var numSetsMenaionStycheras = 0;

    var last_i = -1;
    for (let [i, element] of psalm140menaionStycheras.entries()) {
        if (element in gloriaDict) {
            if (last_i === i-1){
                // prev element was the tone for glory/ glory and now
                numSetsMenaionStycheras -= 1;
            }
            break
        };
        if (typeof element === "string" && isNaN(parseInt(element[0]))) numStycheras += 1;
        if (!isNaN(parseInt(element[0]))) {numSetsMenaionStycheras += 1; last_i = i;}
    }

    var stycheraScheme;
    var stycheras;
    var psalm140OctoechosStycheras;
    if (dayOfWeek === 0 && dayData["class"] < 12){
        // Sunday without Lord's feast
        psalm140tone = glas;
        psalm140OctoechosStycheras = vespersOctoechosData["ps140"];
        if (prePostFeast != "" && dayData["class"] > 6) {
            // in the current data format, 0th stychera is tone
            stycheras = psalm140OctoechosStycheras.slice(0, 4).concat(psalm140menaionStycheras)
            if (numStycheras === 6){
                // 3 + 3 + 4
                stycheraScheme = Array(6).fill(1).concat([2, 1, 1])
            } else {
                stycheraScheme = Array(10).fill(1)
            }
        } else if (dayData["class"] > 6){
            // in the current data format, 0th stychera is tone
            stycheras = psalm140OctoechosStycheras.slice(0, 5);
            // adding all the stycheas
            stycheras = stycheras.concat(psalm140menaionStycheras)
            if (numStycheras === 3){
                stycheraScheme = Array(4).fill(1).concat([2, 2, 2])
            } else if (numStycheras === 4){
                stycheraScheme = Array(4).fill(1).concat([2, 2, 1, 1])
            } else if (numStycheras === 5){
                stycheraScheme = Array(4).fill(1).concat([2, 1, 1, 1, 1])
            } else if (numStycheras === 6){
                stycheraScheme = Array(10).fill(1)
            }
            numStycheras += 4;
        } else if (dayData["class"] === 6){
            if (numStycheras === 3){
                // in the current data format, 0th stychera is tone
                stycheras = psalm140OctoechosStycheras.slice(0, 7);
                // adding all the stycheas
                stycheras = stycheras.concat(psalm140menaionStycheras)
                stycheraScheme = Array(6).fill(1).concat([2, 1, 1])
                numStycheras = 9;
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
    } else {
         // great vespers not on Sunday
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
         else if (numStycheras > 7) stycheraScheme = Array(8).fill(1);
    }

    var i;
    var numVersesLeft;
    var currentPsalm;
    var nextPsalmList = [psalm116split];
    if (!isGreatVespers) {
        i = 2;   // start at 2nd verse of ps 129
        numVersesLeft = 6;
        currentPsalm = psalm129split;
    } else if (dayOfWeek === 0 && dayData["class"] < 12) {
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
        if (numVersesLeft === 2) {
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
            if (stychera === "n" && dayOfWeek === 0 && dayData["class"]<=10){
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
    else document.getElementById("priestly_prayers").innerHTML = prayersList[glas] + "<br><br>";

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

async function makeKathisma(dayOfWeek, isGreatVespers, mm, dd, season, priest, ekteniaData){
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

    if (dayOfWeek === 1) {
      document.getElementById("kathisma").innerHTML = `<div class=\"rubric\">No kathisma on Sunday night</div><br>`;
      return
    }

    var k;


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

    // replace with readPsalmsFromNumbers when psalms are here
    var kathPsalms = await getData(`${address}\\psalms\\kathismas.json`)
    var kathPsalmsToText = ""
    for (const [i, stasis] of kathPsalms[k].entries()){
        kathPsalmsToText += `
        <div class="rubric">Psalms ${stasis} (in traditional/LXX numeration)</div>
        ${tripleAlleluia}`
        if (isGreatVespers && dayOfWeek != 0) break;
        if (i < 2) kathPsalmsToText += `${LHM} <FONT COLOR="RED">(3)</FONT><br>${gloryAndNow}`
    }
    if (isGreatVespers && dayOfWeek != 0){
      document.getElementById("kathisma").innerHTML = `<div class="subhead">First stasis of Kathisma ${k}</div>${kathPsalmsToText}<br>`
    } else {
      document.getElementById("kathisma").innerHTML = `<div class="subhead">Kathisma ${k}</div>${kathPsalmsToText}<br>`;
    }

    makeSmallEktenia(priest, ekteniaData);

}

function makeEktenia(ekteniaData, key=false){
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