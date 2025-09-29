import { usualBeginning, comeLetUs , lesserDoxology, itIsTrulyRight, trisagionToPater, glory, andNow, LHM, prayerOfTheHours, gloryAndNow, moreHonorable, inTheName,prayerBlessingMayGodBeGracious, amen, endingBlockMinor } from './text_generation.js';
import { parseDate, getData, } from './script.js';

var address = `Text\\English`

export function compline(priest, full, date){
	var season, seasonToShow, glas;
    var chosenDate = new Date(date);
	[season, seasonToShow, glas] = parseDate(chosenDate);
	// it seems, days are shifted. now, Sunday is 7
	// another + 1 is because we start the day in the evening
	var dayOfWeek = (chosenDate.getDay() + 1)%7 + 1;
	/// change glas on Saturday evening
	if (dayOfWeek === 7){
	    glas = glas % 8 + 1
	}
	const dd_mm = String(chosenDate.getDate()+1).padStart(2, "0") + String(chosenDate.getMonth() + 1).padStart(2, "0");

    const isIncarnationFeast = (dd_mm === "2412" || dd_mm === "0501" || dd_mm === "2403")

    if ((season === "Lent" && dayOfWeek < 6) || isIncarnationFeast){
        return greatCompline(full, season, dayOfWeek, priest, glas);
    }

    return smallCompline(full, season, dayOfWeek, priest, glas);
}

function greatCompline(full, season, dayOfWeek, priest, glas){
    // placeholder
    return "<div class=\"rubric\">No great compline yet.</div><br>"+smallCompline(full, season, dayOfWeek, priest, glas);
}


function smallCompline(full, season, dayOfWeek, priest, glas){
    loadText(full, dayOfWeek, priest, glas);

	return `<h2>Compline</h2>
	${usualBeginning(priest, season)}<br><br>
	${comeLetUs}<br><br>
	<div id="psalms"></div><br>
	<div class=subhead>The Symbol of Faith</div>
	<div id="creed"></div><br>
	<div class="rubric">A canon is said here.</div>
	<div id="canonSelector">
      <label><input type="radio" name="canonChoice" value="omit_canon"> Omit the canon</label><br>
      <label><input type="radio" name="canonChoice" value="shorten_canon" id="shorten_canon"> Shorten the canon</label><br>
      <label><input type="radio" name="canonChoice" value="full_canon" id="full_canon"> Full canon</label>
    </div>
    <div id="canon"></div><br>
    ${itIsTrulyRight}<br><br>
    ${trisagionToPater(priest)}
    <div id="troparia"></div><br>
    ${LHM} <FONT COLOR="RED">(40)</FONT><br>
	${prayerOfTheHours}<br>
	${LHM} <FONT COLOR="RED">(3)</FONT><br>
	${gloryAndNow}
	${moreHonorable}<br><br>
	${inTheName}<br>
	${prayerBlessingMayGodBeGracious(priest)}<br>
	${amen}
    <div id="prayers"></div><br>
    <div id="penitential_troparia"></div><br>
	${endingBlockMinor(priest)}<br>
	<div id="after_prayers"></div><br>
	`;
}

async function loadText(full, dayOfWeek, priest, glas) {
	const filename = `${address}\\horologion\\small_compline.json`;
	const jsonData = await getData(filename);

	const psalmNums = jsonData["psalms"];
	const psalmPaths = psalmNums.map(n => `${address}\\psalms\\${n}.txt`);

	var ekteniasData;
    if (priest === "1"){
         ekteniasData = await getData(`${address}\\horologion\\ektenias.json`);
    }
    
    if (full === "1") {
        const psalmData = await Promise.all(
            psalmPaths.map(async path => {
                const resp = await fetch(path);
                return resp.text();
            })
        );

        var formattedValues = ""
        for (const [i, psalm] of  psalmData.entries()){
            formattedValues += `<div class="subhead">Psalm ${psalmNums[i]}</div>${psalm}`
        }
        document.getElementById("psalms").innerHTML = `${formattedValues}<br><div id="lesserDoxology"></div>`;

        document.getElementById("full_canon").checked = true;
        lesserDoxology("compline");

        document.getElementById("penitential_troparia").innerHTML = penitentialTroparia(priest, jsonData, ekteniasData);
    } else if (full === "0") {
        if (dayOfWeek < 7) {
            var i = dayOfWeek%4 - (dayOfWeek < 4)
            const n = psalmNums[i];
            const resp = await fetch(psalmPaths[i]);
            const psalmData = await resp.text();

            document.getElementById("psalms").innerHTML = `<div class="subhead">Psalm ${n}</div>${psalmData}`;
        } else if (dayOfWeek === 7) {
            document.getElementById("psalms").innerHTML = `<div id="lesserDoxology"></div>`;
            lesserDoxology("compline");
        } else {
            throw new Error("No data available for the selected day.");
        }
        document.getElementById("shorten_canon").checked = true;
        document.getElementById("penitential_troparia").innerHTML = "";
    }
    selectTropar(dayOfWeek, jsonData, glas).then(tropar => {
        document.getElementById("troparia").innerHTML = tropar;
    });
    getData(`${address}\\horologion\\creed.json`).then(creed => {
        document.getElementById("creed").innerHTML = creed["0"];
    });
    selectCanon(dayOfWeek, glas, full, jsonData["canon_refrain"]);
    document.getElementById("prayers").innerHTML = jsonData["prayers"].join("<br><br>");
    document.getElementById("after_prayers").innerHTML =  postComplinePrayers(priest, jsonData, ekteniasData, dayOfWeek);
}

async function constructCanon(dayOfWeek, glas, full, refrain){
    // 1. try to find a correct canon (so far, only in octoechos)
    // 2. use the default one otherwise (it's from tuesday of the tone 8)
    const canon_address = `${address}\\octoechos\\${glas}\\${dayOfWeek}_compline.json`
    try{
        console.log(`Found a canon for ${dayOfWeek} day of tone ${glas}.`)
        var err = ""
        var canonData = await getData(canon_address);
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
            canon += `${LHM} <FONT COLOR="RED">(3)</FONT><br>${gloryAndNow}<br>${ode.slice(1).join("")}<br>`;
            continue;
        }
        if (!allowedOdes.has(ode_n)) continue;
        canon += `<div class=rubric>Ode ${ode_n}</div>`;
        var n_trop = ode.length - 1;
        for (const [index, tropar] of ode.slice(1).entries()){
            if (index === 0){  // irmos
                canon += `<b>${tropar}</b><br>`
            } else if (index === n_trop - 2){  // penultimate: glory
                canon += `<i>${glory}</i><br>` + tropar + "<br>"
            } else if (index === n_trop - 1){  // ultimate: and now
                canon += `<i>${andNow}</i><br>` + tropar + "<br>"
            } else {  // in the middle: add refrain
                canon += `<i>${refrain}</i><br>` + tropar + "<br>"
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

async function selectTropar(dayOfWeek, hourData, glas){
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
    // TODO start with feasts and post-feasts

    // Sunday
    if (dayOfWeek === 7){
        const data = await getData(`${address}\\octoechos\\sunday_troparia_kontakia.json`);
        return data["hypakoe"][glas];
    }

    const daily_troparia = await getData(`${address}\\horologion\\daily_troparia_kontakia.json`);

    // Friday is special: using Saturday troparion and less of proper compline ones
    if (dayOfWeek === 6){
        return `<div class=rubric>If compline is said in a church dedicated to Our Lord or Our Lady, a troparion of the church is said here.</div>
        ${daily_troparia["troparia"]["6"][0]}<br>
        ${glory}<br>
        ${hourData["daily_troparia"][2]}<br>
        ${andNow}<br>
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
        thisDayTropars.splice(1, 0, "<br>")
    }
    if (dayOfWeek === 3) {
        // don't forget the church
        const temple = `<div class=rubric>If compline is said in a church dedicated to Our Lord or Our Lady, a troparion of the church is said here.</div>`
        const templeS = `<div class=rubric>If compline is said in a church dedicated to a saint, a troparion of the church is said here.</div>`
        thisDayTropars.splice(1, 0, templeS)
        thisDayTropars.splice(0, 0, temple)
    } else {
        const temple = `<div class=rubric>If compline is said in a church, a troparion of the church is said here.</div>`;
        thisDayTropars.splice(0, 0, temple);
        thisDayTropars.push("<br>");
    }

    complineTroparia.splice(3,0, `${andNow}`);
    complineTroparia.splice(2,0, `${glory}`);
    return `${thisDayTropars.join("")}${complineTroparia.join("<br>")}`
}

function penitentialTroparia(withPriest, jsonData, ekteniasData){
    var tropList = jsonData["penitential_troparia"]
    tropList.splice(2,0, `${andNow}`);
    tropList.splice(1,0, `${glory}`);
    const trop = tropList.join("<br>");
    if (withPriest == 1){
        return trop + "<br><br>" + ekteniasData["at_compline"].join("<br>");
    }
    return trop;
}

function  postComplinePrayers(withPriest, data, ekteniasData, dayOfWeek) {
    // if there is a priest, doing the pomynannia (mentions)
    // if no, the penitential prayer from Typica is used (Dolnytsky prescribes it)
    // in some horologions, it is also followed by a private list of petitions
	if (withPriest == "1") {
	    const rub = `<br><br><div class="rubric">The following is said everywhere:</div>`
	    var ektenia = ekteniasData["after_compline"].join("<br>")
	    if (dayOfWeek !== 7){
	        ektenia +=`<br><div class="rubric">For the departed:</div>` + ekteniasData["after_compline_for_the_dead"].join("<br>")
	    }
		return data["after_prayers"]["with_priest"].join("") + rub + ektenia;
	} else {
		return data["after_prayers"]["without_priest"].join("");
	}
}