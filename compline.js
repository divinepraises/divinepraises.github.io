import { cross, usualBeginning, comeLetUs , lesserDoxology, itIsTrulyRight, trisagionToPater, tripleAlleluia, glory, andNow, LHM, prayerOfTheHours, gloryAndNow, moreHonorable, inTheName,prayerBlessingMayGodBeGracious, amen, endingBlockMinor, StEphremPrayer } from './text_generation.js';
import { getDayInfo, getData, readPsalmsFromNumbers, isBetweenDates  } from './script.js';

var address = `Text\\English`

export async function compline(priest, full, date){
	let [year, mm, dd, season, glas, dayOfWeek, dateAddress] = getDayInfo(date, true);

	const dd_mm = String(dd).padStart(2, "0") + String(mm).padStart(2, "0");

    var dayData;

    try{
        dayData = await getData(`${address}\\menaion\\${dateAddress}.json`);
    } catch (error) {
        dayData = {"class" : 0};
        `No data for this day! ${`${address}\\menaion\\${dateAddress}.json`}`
    }
    const isIncarnationFeast = (dd_mm === "2512" || dd_mm === "0601" || dd_mm === "2503");
    const isAlleluiaDay = (
        isBetweenDates(mm, dd, 11, 15, 12, 19) &&
        dayData["class"] <= 4 &&
        !("forefeast" in dayData) &&
        !("postfeast" in dayData) &&
        (dayOfWeek === 3 || dayOfWeek === 5)
    )

    var beginning, ending;
    if (isIncarnationFeast) {
        greatComplineBeginning(full, season, priest, dayOfWeek, dayData, isIncarnationFeast);
        vespersEnding(priest, dayData, dateAddress);
    } else if ((season === "Lent" && dayOfWeek < 6)){
        greatComplineBeginning(full, season, priest, dayOfWeek, dayData, isIncarnationFeast);
        complineEnding(full, dayOfWeek, priest, glas, dayData, true);
    } else {
        smallComplineBeginning(full, season, dayOfWeek, priest, isAlleluiaDay);
        complineEnding(full, dayOfWeek, priest, glas, dayData, false);
    }

    return `
        <div id="beginning"></div><br>
        <div id="ending"></div>`
}

async function complineEnding(full, dayOfWeek, priest, glas, dayData, isGreatCompline) {
	const smallComplineData = await getData(`${address}\\horologion\\small_compline.json`);
	loadComplineEnding(smallComplineData, full, dayOfWeek, priest, glas, dayData, isGreatCompline);
    document.getElementById("ending").innerHTML =  `<div id="canonSelector">
      <label><input type="radio" name="canonChoice" value="omit_canon"> Omit the canon</label><br>
      <label><input type="radio" name="canonChoice" value="shorten_canon" id="shorten_canon"> Shorten the canon</label><br>
      <label><input type="radio" name="canonChoice" value="full_canon" id="full_canon"> Full canon</label>
    </div><br>
    <div id="canon"></div>
    ${itIsTrulyRight}<br><br>
    ${trisagionToPater(priest)}
	<div class=subhead>Troparia</div><br>
    <div id="troparia"></div><br>
    ${LHM} <FONT COLOR="RED">(40)</FONT><br><br>
	${prayerOfTheHours}<br><br>
	${LHM} <FONT COLOR="RED">(3)</FONT><br><br>
	${gloryAndNow}<br><br>
	${moreHonorable}<br><br>
	${inTheName}<br><br>
	${prayerBlessingMayGodBeGracious(priest)}<br><br>
	${amen}<br><br>
    <div id="st_ephrem"></div>
    <div id="additional_pater"></div>
	<div class=subhead>Compline Prayers</div><br>
    <div id="prayers"></div><br>
    <div id="penitential_troparia"></div>
	<div class=subhead>Dismissal</div><br>
	${endingBlockMinor(priest)}<br>
	<div class=subhead>Prayers after dismissal</div><br>
	<div id="after_prayers"></div><br>
	`;
}

async function loadComplineEnding(smallComplineData, full, dayOfWeek, priest, glas, dayData, isGreatCompline){
	var ekteniasData = await getData(`${address}\\horologion\\night_ektenias.json`);

    if (full === "1") {
        document.getElementById("full_canon").checked = true;
        document.getElementById("penitential_troparia").innerHTML = penitentialTroparia(priest,  smallComplineData, ekteniasData);
    } else if (full === "0") {
        document.getElementById("shorten_canon").checked = true;
        document.getElementById("penitential_troparia").innerHTML = "";
    }

    selectCanon(dayOfWeek, glas, full, smallComplineData["canon_refrain"]);
    document.getElementById("prayers").innerHTML = smallComplineData["prayers"].join("<br><br>");
    document.getElementById("after_prayers").innerHTML =  postComplinePrayers(priest, smallComplineData, ekteniasData, dayOfWeek);

    if (isGreatCompline){
	    const greatComplineData = await getData(`${address}\\horologion\\great_compline.json`);
        makeThirdSectionTroparia(greatComplineData["troparia_3"])
        document.getElementById("st_ephrem").innerHTML = StEphremPrayer() + "<br>";
        document.getElementById("additional_pater").innerHTML = `${trisagionToPater(priest)}
            ${LHM} <FONT COLOR="RED">(12)</FONT><br><br>`
    } else {
        selectTropar(dayOfWeek,  smallComplineData, glas, dayData).then(tropar => {
            document.getElementById("troparia").innerHTML = tropar;
        });
        document.getElementById("st_ephrem").innerHTML = "";
        document.getElementById("additional_pater").innerHTML = "";
    }
}

async function smallComplineBeginning(full, season, dayOfWeek, priest, isAlleluiaDay, glas, dayData) {
	const smallComplineData = await getData(`${address}\\horologion\\small_compline.json`);

    loadSmallComplineBeginning(smallComplineData, full, season, dayOfWeek, isAlleluiaDay, priest, glas, dayData);
	document.getElementById("beginning").innerHTML =  `<h2>Small Compline</h2>
	<div id="switch"></div><br>
	${usualBeginning(priest, season)}<br><br>
	${comeLetUs}<br><br>
	<div id="psalms"></div><br>
	<div class=subhead>The Symbol of Faith</div><br>
	<div id="creed"></div>
	`;
}

async function loadSmallComplineBeginning(smallComplineData, full, season, dayOfWeek, isAlleluiaDay, priest, glas, dayData) {
	const psalmNums =  smallComplineData["psalms"];
	const psalmPaths = psalmNums.map(n => `${address}\\psalms\\${n}.txt`);

    if (full === "1") {
        var formattedValues = (await readPsalmsFromNumbers(psalmNums)).join("");
        document.getElementById("psalms").innerHTML = `${formattedValues}<br><br><div id="lesserDoxology"></div>`;
        document.getElementById("lesserDoxology").innerHTML = await lesserDoxology("compline");
    } else if (full === "0") {
        if (dayOfWeek > 0) {
            var i = dayOfWeek%4 - (dayOfWeek < 4)
            const n = psalmNums[i];
            const resp = await fetch(psalmPaths[i]);
            const psalmData = await resp.text();

            document.getElementById("psalms").innerHTML = `<div class="subhead">Psalm ${n}</div>${psalmData}`;
        } else if (dayOfWeek === 0) {
            lesserDoxology("compline").then(dox => {
                document.getElementById("psalms").innerHTML = dox;
            });
        }
    }
    getData(`${address}\\horologion\\creed.json`).then(creed => {
        document.getElementById("creed").innerHTML = creed["0"];
    });

	if (isAlleluiaDay){
        document.getElementById("switch").innerHTML =`
          <div class=rubric>There is an option in Typicon for this day to be according to a penitential rite.
          This means one can pray a much longer Great Compline
          (other hours are also supposed to be changed, but this is not yet implemented).
          If you want to undo it later, just reload the page.</div>
          <label><input type="checkbox" name="greatCompline"> Use Great Compline instead.</label><br>
            `;
        document.getElementById("switch").addEventListener("change", () => {
            greatComplineBeginning(full, season, priest, dayOfWeek, dayData, false);
            complineEnding(full, dayOfWeek, priest, glas, dayData, true);
            }
        );
    }
}

async function greatComplineBeginning(full, season, priest, dayOfWeek, dayData, isIncarnationFeast) {
	const smallComplineData = await getData(`${address}\\horologion\\small_compline.json`);

    loadGreatComplineBeginning(smallComplineData, full, dayOfWeek, dayData, isIncarnationFeast);
	document.getElementById("beginning").innerHTML =  `<h2>Great Compline</h2>
	${usualBeginning(priest, season)}<br><br>
	${comeLetUs}<br><br>
	<div id="psalms_1"></div><br>
	<div class=subhead>Canticle of Isaiah</div><br>
	<div id="god_is_with_us"></div><br>
	<div id="troparia_0"></div>
	<div class=subhead>The Symbol of Faith</div><br>
	<div id="creed"></div><br>
	<div id="petitions"></div><br>
	${trisagionToPater(priest)}
	<div class=subhead>Troparia</div><br>
	<div id="troparia_1"></div><br>
	${LHM} <FONT COLOR="RED">(40)</FONT><br><br>
	${gloryAndNow}<br><br>
	${moreHonorable}<br><br>
	${inTheName}<br><br>
	${prayerBlessingMayGodBeGracious(priest)}<br><br>
	${amen}<br><br>
	<div class=subhead>Prayer of saint Basil</div><br>
	<div id="prayer_1"></div><br><br>
	<div class=subhead>Section 2</div><br>
	${comeLetUs}<br><br>
	<div id="psalms_2"></div>
	<div class=subhead>Prayer of king Manasses</div>
	<div id="prayer_manasses"></div><br>
	${trisagionToPater(priest)}
	<div class=subhead>Troparia</div><br>
	<div id="troparia_2"></div><br>
	${LHM} <FONT COLOR="RED">(40)</FONT><br><br>
	${gloryAndNow}<br><br>
	${moreHonorable}<br><br>
	${inTheName}<br><br>
	${prayerBlessingMayGodBeGracious(priest)}<br><br>
	${amen}<br><br>
	<div class=subhead>Prayer of saint Basil</div><br>
	<div id="prayer_2"></div><br><br>
	<div class=subhead>Section 3</div><br>
	${comeLetUs}<br><br>
	<div id="psalms_3"></div><br>
	<div id="lesserDoxology"></div>
	`;
}

async function loadGreatComplineBeginning(smallComplineData, full, dayOfWeek, dayData, isIncarnationFeast) {
    const greatComplineData = await getData(`${address}\\horologion\\great_compline.json`);

    const alleluiaUnit = `<br><br>${tripleAlleluia} ${LHM} <FONT COLOR="RED">(3)</FONT><br>${gloryAndNow}`

    if (full === "1") {
        const psalms_1 = (await readPsalmsFromNumbers(greatComplineData["psalms_1"]));
        psalms_1.splice(6, 0, alleluiaUnit+"<br><br>");
        psalms_1.push(alleluiaUnit);
        document.getElementById("psalms_1").innerHTML = psalms_1.join("");
        document.getElementById("psalms_2").innerHTML = (await readPsalmsFromNumbers(greatComplineData["psalms_2"])).join("");
        document.getElementById("psalms_3").innerHTML = (await readPsalmsFromNumbers(greatComplineData["psalms_3"])).join("");
    } else if (full === "0") {
        const dayToPsalm_1 = {1: [0, 3], 2: [1, 4], 3: [2, 5], 4:[2, 5]}[dayOfWeek];
        const dayToPsalm_2_3 = (dayOfWeek + 1)  % 2;

        const psalmNums_1 = dayToPsalm_1.map(i => greatComplineData["psalms_1"][i]);
        const psalms_1 = (await readPsalmsFromNumbers(psalmNums_1));
        psalms_1.splice(2, 0, alleluiaUnit+"<br><br>");
        psalms_1.push(alleluiaUnit);
        document.getElementById("psalms_1").innerHTML = psalms_1.join("");
        document.getElementById("psalms_2").innerHTML = (await readPsalmsFromNumbers([greatComplineData["psalms_2"][dayToPsalm_2_3]])).join("");
        document.getElementById("psalms_3").innerHTML = (await readPsalmsFromNumbers([greatComplineData["psalms_3"][dayToPsalm_2_3]])).join("");
    }

    makeNethimon(greatComplineData["god_is_with_us"], greatComplineData["troparia_0"]);
    makePetitions(greatComplineData["petitions"], full, isIncarnationFeast);
    makeFirstSectionTroparia(greatComplineData["troparia_1"], full, dayOfWeek, isIncarnationFeast, dayData);

    getData(`${address}\\horologion\\creed.json`).then(creed => {
        document.getElementById("creed").innerHTML = creed["0"];
    });

    document.getElementById("prayer_1").innerHTML = greatComplineData["prayer_1"]

    // section 2
    document.getElementById("prayer_manasses").innerHTML = greatComplineData["manasses"]
    makeSecondSectionTroparia(smallComplineData["penitential_troparia"], isIncarnationFeast, dayData);

    getData(`${address}\\horologion\\3hour.json`).then(data => {
        document.getElementById("prayer_2").innerHTML = data["prayer"];
    });

    // section 3
    lesserDoxology("compline").then(dox => {
        document.getElementById("lesserDoxology").innerHTML = dox;
    });
}

async function makeThirdSectionTroparia(troparia){
    const verses = (await readPsalmsFromNumbers([150]))[1].split("•");
    var res = `<div class="rubric">Two choirs take turns in chanting<br>Tone 6</div>
        <FONT COLOR="RED">1.</FONT> ${troparia[0]}<br>
        <FONT COLOR="RED">2.</FONT> ${troparia[0]}<br>
        `;
    for (let [i, verse] of verses.slice(0, verses.length-1).entries()){
        res += `<FONT COLOR="RED">${i%2+1}.</FONT> ${verse}* ${troparia[0]}<br>`
    }
    res += `<FONT COLOR="RED">1.+2.</FONT> ${verses[0]}* ${troparia[0]}<br><br>
        <i>${glory}</i><br><br>
        ${troparia[1]}<br><br>
        <i>${andNow}</i><br><br>
        ${troparia[2]}<br><br>
        ${troparia[3]}<br><br>
        ${troparia[4]}`;
    document.getElementById("troparia").innerHTML = res;
}

function makeSecondSectionTroparia(troparia, isIncarnationFeast, dayData){
    if (isIncarnationFeast){
        document.getElementById("troparia_2").innerHTML = `
            <div class="rubric">Penitential troparia are replaced by this festal kontakion:</div>
            ${dayData["kontakia"]}`;
        return
    }
    var indices = [1, 2];
    if (troparia.length === 5) {indices = [2, 4]}
    document.getElementById("troparia_2").innerHTML = `
        ${troparia[0]}<br><br>
        <i>${glory}</i><br><br>
        ${troparia[indices[0]]}<br><br>
        <i>${andNow}</i><br><br>
        ${troparia[indices[1]]}
        `
}

function makeFirstSectionTroparia(tropariaDict, full, dayOfWeek, isIncarnationFeast, dayData){
    if (isIncarnationFeast){
        document.getElementById("troparia_1").innerHTML = dayData["troparia"];
        return
    }
    var troparia;
    if (dayOfWeek === 1 || dayOfWeek === 3){
        troparia = tropariaDict["1, 3"];
        document.getElementById("troparia_1").innerHTML = `<div class="rubric">Tone 2</div>
        ${troparia[0]}<br><br>
        <i>${tropariaDict["verse"]}</i><br><br>
        ${troparia[1]}<br><br>
        <i>${glory}</i><br><br>
        ${troparia[2]}<br><br>
        <i>${andNow}</i><br><br>
        ${troparia[3]}
        `
        return
    }
    troparia = tropariaDict["2, 4"];
    var res = `<div class="rubric">Tone 2</div>
        ${troparia[0]}<br><br>
        <i>${tropariaDict["verse"]}</i><br><br>`;
    if (full == "1"){
        res += `
            ${troparia[0]}<br><br>
            <i>${glory}</i><br><br>
            ${troparia[1]}<br><br>
            <i>${andNow}</i><br><br>
            ${troparia[2]}
            `
    } else {
        res += `
            ${troparia[1]}<br><br>
            <i>${gloryAndNow}</i><br><br>
            ${troparia[2]}
            `
    }
    document.getElementById("troparia_1").innerHTML = res;
}


function makePetitions(petitions, full, isIncarnationFeast){
    if (full === "0"){
        document.getElementById("petitions").innerHTML = petitions.join("<br>");
        return;
    }
    var res = `
        ${cross} ${petitions[0]} <FONT COLOR="RED">(3)</FONT> <br>`;
    for (let [i, petition] of petitions.slice(1, petitions.length).entries()){
        res += `${cross} ${petition} <FONT COLOR="RED">(2)</FONT><br>`
    }
    if (!isIncarnationFeast) {
        res = `<div class="rubric">One choir chants a petition, while the other one makes an inclination.</div>` + res;
    } else {
        res = `<div class="rubric">If there are two choirs, they chant in turns:</div>` + res;
    }
    document.getElementById("petitions").innerHTML =  res;
}

function makeNethimon(verses, troparia){
    const refrain = verses[0];
    var res = `<div class="rubric">Two choirs take turns in chanting, or one reader reads:</div>
        <FONT COLOR="RED">1.</FONT> ${verses[1]} ${refrain}<br>`;
    for (let [i, verse] of verses.slice(1, verses.length).entries()){
        res += `<FONT COLOR="RED">${(i+1)%2+1}.</FONT> ${verse} ${refrain}<br>`
    }
    document.getElementById("god_is_with_us").innerHTML = res + `<FONT COLOR="RED">1.+2.</FONT> ${verses[1]} ${refrain}`;

    document.getElementById("troparia_0").innerHTML = `
        ${troparia[0]}<br><br>
        ${glory}<br><br>
        ${troparia[1]}<br><br>
        ${andNow}<br><br>
        ${troparia[2]}<br><br>
        ${troparia[3]}<br><br>
        ${troparia[4]}<br><br>`;
}

async function constructCanon(dayOfWeek, glas, full, refrain){
    // 1. try to find a correct canon (so far, only in octoechos)
    // 2. use the default one otherwise (it's from tuesday of the tone 8)
    const canon_address = `${address}\\octoechos\\${glas}\\${dayOfWeek}_compline.json`
    try{
        var err = ""
        var canonData = await getData(canon_address);
        console.log(`Found a canon for ${dayOfWeek} day of tone ${glas}.`)
    } catch (error) {
        console.log(`No canon for ${dayOfWeek} day of tone ${glas}. Using the default one`)
        var err = "<div class=rubric>The proper canon for today is not yet added, please use the default one:</div>"
        canonData = await getData(`${address}\\octoechos\\8\\2_compline.json`);
    }
    var allowedOdes;
    if (full === "1") {
        // the three-odes can have a 2nd ode
        allowedOdes = new Set(["1","2", "3","4","5","6","7","8","9"]);
    } else {
        // Lviv council shortenings
        if (dayOfWeek === 1) {var i = 1} else {i = dayOfWeek + 1}
        allowedOdes = new Set([i.toString(), "9"]);
    }
    var canon = err
    // Assumptions about the text file:
    // 1) the first element of each ode is the number.
    // We need the number, as there will be three-odes here, so we want a way to know what ode we're at.
    // 2) the next one is the hirmos.
    // 3) the odes won't have less than 3 elements including hirmos
    // TODO (i'm not sure the last one holds for three-odes).
    // 4) Elements included after the 3rd and 6th odes are labeled as "3a" and "6a".

    // Here we just combine the canon, and add the refrain.
    // The penultimate and the last tropars will need "glory" and "now".
    for (const ode of canonData) {
        var ode_n = ode[0]
        if ((ode_n === "3a" && allowedOdes.has("3")) || (ode_n === "6a" && allowedOdes.has("6"))){
            canon += `${LHM} <FONT COLOR="RED">(3)</FONT><br><br>${gloryAndNow}<br><br>${ode.slice(1).join("")}<br><br>`;
            continue;
        }
        if (!allowedOdes.has(ode_n)) continue;
        canon += `<div class=rubric>Ode ${ode_n}</div>`;
        var n_trop = ode.length - 1;
        for (const [index, tropar] of ode.slice(1).entries()){
            if (index === 0){  // irmos
                canon += `<b>${tropar}</b><br><br>`
            } else if (index === n_trop - 2){  // penultimate: glory
                canon += `<i>${glory}</i><br><br>` + tropar + "<br><br>"
            } else if (index === n_trop - 1){  // ultimate: and now
                canon += `<i>${andNow}</i><br><br>` + tropar + "<br><br>"
            } else {  // in the middle: add refrain
                canon += `<i>${refrain}</i><br><br>` + tropar + "<br><br>"
            }
        }
    }
    document.getElementById("canon").innerHTML = canon;
}

async function selectCanon(dayOfWeek, glas, full, refrain){
    constructCanon(dayOfWeek, glas, full, refrain);
    document.getElementById("canonSelector").addEventListener("change", () => {
        var canonInstruction = document.querySelector('input[name="canonChoice"]:checked')?.value;
        if (canonInstruction === "omit_canon"){
            document.getElementById("canon").innerHTML = ""
        } else if (canonInstruction === "full_canon"){
	        constructCanon(dayOfWeek, glas, "1", refrain);
	    } else {
            constructCanon(dayOfWeek, glas, "0", refrain);
	    }
    });
}

async function selectTropar(dayOfWeek, hourData, glas, dayData){
   /*
        - В п’ять перших днів тижня беруться наступних шість тропарів,
        >тобто спочатку храму, якщо він господній або богородичний,
        після цього тропар дня седмичного;
        >якщо храм не господній і не богородичний, а святого,
        то спочатку тропар дня, а після нього храму;
        та інші чотири тропарі, що подані в часослові, починаючи від „Боже Отців наших” з подальшими трьома;
        ченці перед „Боже Отців наших” відмовляють ще й тропар св. Василієві.
        *В четвер тому, що служба – подвійна і має два тропарі, буде сім тропарів,
        а в монастирях – вісім, з тропарем св.Василіяi.
        *На середу і п’ятницю тому, що тропар – господній, тобто „Чесного хреста”, він в будь-якому разі бере перше місце,
        після нього – тропар храму”.
        - На суботу, тобто в п’ятницю ввечері на суботу, тропарів – три:
        спочатку дня, а далі Слава: кондак померлим, І нині: кондак дня.
        Тому, що в суботу храмова служба має більше значення, ніж в інші дні тижня,
        що випливає з того, що вона має на утрені канон,
        >то задля цього попереджується тропар дня тропарем храму,
        якщо він господній або богородичний,
        >але не в випадку, коли храм святого, тому що його пам’ять вже згадується в тропарі дня,
        який присвячено всім святим”
        - На неділю, тобто з суботи ввечері на неділю наші часослови подають тільки іпакой голосу неділі”
        - В випадку святкової служби (перед- і посвяття господнього чи богородичного),
        а також й у випадку святого полієлейного, відмовляється тільки кондак названої служби
    */

   const dayClass = dayData["class"];
   var prePostFeast = "";
   var prePostFeastKontakion = "";
   var kontakion = "";

    if ("forefeast" in dayData) {
        prePostFeast = "forefeast";
        prePostFeastKontakion = dayData["kontakia"];
    } else if ("postfeast" in dayData) {
        prePostFeast = "postfeast";
        prePostFeastKontakion = (await getData(`${address}\\menaion\\${dayData["postfeast"]}.json`))["kontakia"];
    }
    if (Array.isArray(prePostFeastKontakion)) {
        // we assume that in a list, the kontakion of a pre-feast is the last one
        // for the actual feast this handles the case if a kontakion is given in a 1-element list
        prePostFeastKontakion = prePostFeastKontakion[prePostFeastKontakion.length-1]
    }

    if (dayClass >= 8) {
        if ("kontakia" in dayData) kontakion = dayData["kontakia"];
        else kontakion = (await getCommonText("kontakia", dayData));
        if (Array.isArray(kontakion)) kontakion = kontakion[0];
    }

    // a polyeleos (and higher)
    if (kontakion != "" && prePostFeast === "") {
        // even on Sun
        return kontakion;
    } else if (kontakion != "" && prePostFeast != "" && dayOfWeek != 0){
        return prePostFeastKontakion;
    } else if (kontakion != "" && prePostFeast === "forefeast" && dayOfWeek != 0){
        return prePostFeastKontakion;
    }

    // Sunday
    if (dayOfWeek === 0 && prePostFeast === ""){
        const data = await getData(`${address}\\octoechos\\sunday_troparia_kontakia.json`);
        return data["hypakoe"][glas];
    } else if (dayOfWeek === 0 && prePostFeast === "forefeast") {
        // The case with feast + pre-feast is not specified in Donlytsky,
        // but now it happens with Bl. Josaphata. I infered it should be just the post-feast kontakion
        // by analogy with Sundays.
        return prePostFeastKontakion;
    } else if (dayOfWeek === 0 && prePostFeast === "postfeast" && kontakion === "") {
        const data = await getData(`${address}\\octoechos\\sunday_troparia_kontakia.json`);
        return `${data["hypakoe"][glas]}<br><br>${gloryAndNow}<br><br>${prePostFeastKontakion}`;
    } else if (dayOfWeek === 0 && prePostFeast === "postfeast" && kontakion != "") {
        // yeah, it is inconsistent, but that's what we have in the menaions and hence typicon
        return `${kontakion}<br><br>${gloryAndNow}<br><br>${prePostFeastKontakion}`;
    }

    // not Sunday, not polyeleos
    if (prePostFeast != "") return prePostFeastKontakion;

    const daily_troparia = await getData(`${address}\\horologion\\daily_troparia_kontakia.json`);

    // Friday is special: using Saturday troparion and less of proper compline ones
    if (dayOfWeek === 6){
        return `<div class=rubric>If compline is said in a church dedicated to Our Lord or Our Lady, a troparion of the church is said here.</div><br>
        ${daily_troparia["troparia"]["6"][0]}<br><br>
        <i>${glory}</i><br><br>
        ${hourData["daily_troparia"][2]}<br><br>
        <i>${andNow}</i><br><br>
        ${hourData["saturday_theotokion"]}`;
    }

    // read the data
    const data = await getData(`${address}\\horologion\\daily_troparia_kontakia.json`);
    if (dayOfWeek === 5) {
        // use Wed texts on Fri
        dayOfWeek = 3;
    }
    var thisDayTropars = data["troparia"][dayOfWeek];
    var complineTroparia = hourData["daily_troparia"]

    // combine it all, and add a rubric about church troparion
    if (dayOfWeek === 4){
        thisDayTropars.splice(1, 0, "<br><br>")
    }
    if (dayOfWeek === 3) {
        // don't forget the church
        const temple = `<div class=rubric>If compline is said in a church dedicated to Our Lord or Our Lady, a troparion of the church is said here.</div><br>`
        const templeS = `<br><br><div class=rubric>If compline is said in a church dedicated to a saint, a troparion of the church is said here.</div><br>`
        thisDayTropars.splice(1, 0, templeS)
        thisDayTropars.splice(0, 0, temple)
    } else {
        const temple = `<div class=rubric>If compline is said in a church, a troparion of the church is said here.</div><br>`;
        thisDayTropars.splice(0, 0, temple);
        thisDayTropars.push("<br><br>");
    }

    complineTroparia.splice(3,0, `<i>${andNow}</i>`);
    complineTroparia.splice(2,0, `<i>${glory}</i>`);
    return `${thisDayTropars.join("")}${complineTroparia.join("<br><br>")}`
}

function penitentialTroparia(withPriest,  smallComplineData, ekteniasData){
    var tropList =  smallComplineData["penitential_troparia"]
    tropList.splice(2,0, `${andNow}`);
    tropList.splice(1,0, `${glory}`);
    const trop = `
        <div class=subhead>Penitential troparia</div><br>` + tropList.join("<br><br>");
    if (withPriest == 1){
        return trop + "<br><br>" + ekteniasData["at_compline"].join("<br>");
    }
    return trop + "<br><br>";
}

function  postComplinePrayers(withPriest, data, ekteniasData, dayOfWeek) {
    // if there is a priest, doing the pomynannia (mentions)
    // if no, the penitential prayer from Typica is used (Dolnytsky prescribes it)
    // in some horologions, it is also followed by a private list of petitions
	if (withPriest == "1") {
	    const rub = `<div class="rubric">The following is said everywhere:</div>`
	    var ektenia = ekteniasData["after_compline"].join("<br>")
	    if (dayOfWeek > 0){
	        ektenia +=`<br><div class="rubric">For the departed:</div>` + ekteniasData["after_compline_for_the_dead"].join("<br>")
	    }
		return data["after_prayers"]["with_priest"].join("") + rub + ektenia;
	} else {
		return data["after_prayers"]["without_priest"].join("<br><br>");
	}
}

async function vespersEnding(priest, dayData, dateAddress){
    const menaionData = await getData(`${address}\\menaion\\${dateAddress}_compline.json`)
    loadVespersEnding(priest, dayData, menaionData);
    document.getElementById("ending").innerHTML =  `<div id="lytia_stychera"></div>
        <div id="lytia_selector"></div>
        <div id="lytia_prayers"></div>
        <div id="aposticha"></div>
        <div id="simeon"></div><br>
        ${trisagionToPater(priest)}
        <div id="troparia"></div><br>
        <div id="ektenia_augmented_or_ps33"></div>
        <div id="ending_block"></div><br>`;
}

import { makeAposticha,  makeTroparia, makeEktenia, makeLytia, makeEndingBlockMajor, makePs33 } from './vespers.js';
import { constructDayName } from './script.js';
async function loadVespersEnding(priest, dayData, menaionData){

    const vigilVespersData = await getData(`${address}\\horologion\\vigil_vespers.json`);
    const vespersData = await getData(`${address}\\horologion\\general_vespers.json`)
    const dayName = constructDayName(dayData, false);

    makeLytia(menaionData["lytia"], priest, vespersData, vigilVespersData, dayName);
    makePs33(priest, vigilVespersData);

    document.getElementById("aposticha").innerHTML = await makeAposticha(0, 0, true, dayData, vespersData, menaionData, {});

    document.getElementById("simeon").innerHTML = `<div class="subhead">Song of Simeon</div><br>${vespersData["simeon"]}`;

    document.getElementById("troparia").innerHTML = await makeTroparia(0, 0, true, dayData, "");

    document.getElementById("ending_block").innerHTML = await makeEndingBlockMajor(priest, 8, true, vespersData, dayData);
}