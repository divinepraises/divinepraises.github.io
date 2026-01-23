import { StEphremPrayer, gloryGospel, usualBeginning, tripleAlleluia, glory, andNow, trisagionToPater, prayerOfTheHours, LHM, comeLetUs, gloryAndNow, moreHonorable, inTheName, prayerBlessingMayGodBeGracious, endingBlockMinor, amen, getCommonText } from './text_generation.js';
import { getDayInfo, getData, readPsalmsFromNumbers, replaceCapsWords, specialSunday } from './script.js';
const address = `Text\\English`

export async function minorHour(hour, priest, full, date){
	let [year, mm, dd, season, seasonWeek, glas, dayOfWeek, dateAddress] = getDayInfo(date, false);
	var numOhHour = hour.charAt(0);

    var specialDayData;
    var additionalElements;
    if (dayOfWeek === 0  || (mm === 12 && dd === 26 && dayOfWeek === 1)) {
        const specialSundayName = await specialSunday(mm, dd);
        if (specialSundayName != undefined) {
            specialDayData = await getData(`${address}\\menaion\\${mm}\\${specialSundayName}.json`);
            specialDayData["label"] = specialSundayName;
        }
    } else if (mm === 12 && ((dd === 24 && dayOfWeek <= 5)||(dayOfWeek === 5 && dd >= 22 && dd < 24))){
        additionalElements = await getData(`${address}\\menaion\\12\\24_${numOhHour}hour.json`);
        dateAddress = `12\\24`; // to select correct troparion
    } else if (mm === 1 && ((dd === 5 && dayOfWeek <= 5)||(dayOfWeek === 5 && dd >= 3 && dd < 5))){
        additionalElements = await getData(`${address}\\menaion\\01\\05_${numOhHour}hour.json`);
        dateAddress = `01\\05`;
    }

    var dayTriodionData;
    if (season === "Lent" || season === "Forelent") {
        try {
            dayTriodionData = await getData(`${address}\\triodion\\${season}\\${seasonWeek-1}${dayOfWeek}.json`)
        } catch {}
    }

	const numeral = {
		1: "First",
		3: "Third",
		6: "Sixth",
		9: "Ninth"
	}
	const nextHour = {
		1: "3hour",
		3: "6hour",
		6: "9hour",
		9: "vespers"
	}

	const linkToNext = `https:\/\/divinepraises.github.io/main.html?hour=${nextHour[numOhHour]}&priest=${priest}&full=${full}&date=${date}#come_let_us`;

	loadText(hour, full, priest, season, seasonWeek, dayOfWeek, glas, dateAddress, specialDayData, dayTriodionData, additionalElements);
	return `<h2>The ${numeral[numOhHour]} hour</h2>
	<div class=rubric>Should this hour be said immediately after the previous one, omit this beginning:</div>
	<hr>
	${usualBeginning(priest, season)}
	<hr>
	<a id="come_let_us">${comeLetUs}<br><br></a>
	<div id="psalms"></div><br>
	${tripleAlleluia}<br>
	${LHM} <FONT COLOR="RED">(3)</FONT><br><br>
	<div class="subhead">Troparia</div>
	<div id="troparia"></div><br>
	${andNow}<br><br>
	<div id="theotokion"></div><br>
	<div id="additionalElementsSelector"></div>
	<div id="additional_elements"></div><br>
	<div id="chapter"></div><br>
	<div class="subhead">Trisagion</div>
	${trisagionToPater(priest)}
	<div class="subhead">Kontakion</div>
	<div id="kontakia"></div><br>
	${LHM} <FONT COLOR="RED">(40)</FONT><br><br>
	<div class="subhead">Prayer of the hours</div>
	${prayerOfTheHours}<br><br>
	${LHM} <FONT COLOR="RED">(3)</FONT><br><br>
	${gloryAndNow}<br><br>
	${moreHonorable}<br><br>
	${inTheName}<br><br>
	${prayerBlessingMayGodBeGracious(priest, hour)}<br><br>
	${amen}<br><br>
    <div id="st_ephrem"></div>
	<div class="subhead">Prayer of this hour</div>
	<div id="prayer"></div><br>
	<div class=rubric>When this hour is followed by another one, switch to the <a href="${linkToNext}">next hour</a>. Otherwise, conclude with the dismissal:</div>
	<hr>
	${endingBlockMinor(priest)}
	`;
}

async function loadText(hour, full, priest, season, seasonWeek, dayOfWeek, glas, date, specialDayData, dayTriodionData, additionalElements) {
	const psalmData = await getData(`${address}\\horologion\\${hour}.json`);
	let psalmNums;
	if (additionalElements != undefined) psalmNums = additionalElements["psalms"]
	else psalmNums = psalmData["psalms"]
	const psalmPaths = psalmNums.map(n => `${address}\\psalms\\${n}.txt`);
    var dayData;
	try{
        var err = ""
        dayData = await getData(`${address}\\menaion\\${date}.json`);
    } catch (error) {
        console.log("No data for the day! Using the weekday troparia.")
    }
    const isPenitential = (
        (season === "Lent" && dayOfWeek < 6 && dayOfWeek > 0)
        || ((season === "Forelent" && seasonWeek === 3) && (dayOfWeek === 3 || dayOfWeek === 5))
    );

    if (full === "1") {
        document.getElementById("psalms").innerHTML = (await readPsalmsFromNumbers(psalmNums)).join("");

    } else if (full === "0") {
        var i = dayOfWeek%4 - (dayOfWeek < 4)
        if (dayOfWeek === 0){
            i = 2
        }
        const n = psalmNums[i];
        const resp = await fetch(psalmPaths[i]);
        const  psalmData = await resp.text();
        console.log(i, dayOfWeek)

        document.getElementById("psalms").innerHTML = `<div class="subhead">Psalm ${n}</div>${ psalmData}`;
    }
    selectTropar(hour, dayOfWeek, psalmData, glas, dayData, specialDayData, dayTriodionData).then(tropar => {
        document.getElementById("troparia").innerHTML = tropar;
    });
    selectKondak(hour, dayOfWeek, psalmData, glas, dayData, specialDayData, dayTriodionData).then(kondak => {
        document.getElementById("kontakia").innerHTML = kondak;
    });
    document.getElementById("theotokion").innerHTML = psalmData["theotokion"]
    await arrangeAdditionalElements(additionalElements, hour, priest);
    if (isPenitential) {
        const isLessPenitential = ("forefeast" in dayData || "postfeast" in dayData || dayData["class"] >= 11);
        document.getElementById("st_ephrem").innerHTML = StEphremPrayer(priest, false, isLessPenitential);
    } else {
        document.getElementById("st_ephrem").innerHTML = "";
    }

    document.getElementById("chapter").innerHTML = psalmData["chapter"]
    document.getElementById("prayer").innerHTML = psalmData["prayer"]
}

async function arrangeRoyalHours(additionalElements, hour, priest) {
        var full = document.querySelector('input[name="selectStychera"]:checked')?.value;
        var res = ``;
        const sticheras = additionalElements["stichera"];
        var verses = additionalElements["verses"];
        verses.push(glory);
        verses.push(andNow);
        for (let [i, stichera] of sticheras.entries()){
            if (!isNaN(parseInt(stichera[0]))){
                // this is tone indication
                res += `<div class="rubric">Tone ${stichera}</div>`;
                continue
            }
            if (i === 1) {
                // first troparion
                res += stichera;
                if (full === "1") res += `<FONT COLOR="RED"> (twice)</FONT>`;
                res += `<br><br>`;
                continue
            } else if (!(hour === "9hour" && i === 5 && full === "1")) {
                if (full === "1"){
                // 3 > 0, 1 // 5 > 2 3
                    res += `
                        <i>${verses[i-3]}</i><br><br>
                        ${stichera}<br><br>
                        <i>${verses[i-2]}</i><br><br>
                        ${stichera}<br><br>`
                } else {
                    res += `
                        <i>${verses[i-3]}** ${verses[i-2]}</i><br><br>
                        ${stichera}<br><br>`
                }
            } else if (stichera[stichera.length-2] === "v") {
                    // last stychera of 9th hour not on Epiphany
                    res += `<div class="rubric">The first time this stichera is read by the lead cantor.</div>
                        ${stichera}<br>
                        <div class="rubric">Then, we sing it.</div>
                        <i>${verses[i-3]}</i><br><br>
                        ${stichera}<br>
                        <i>${verses[i-2]}</i><br><br>
                        ${stichera}<br>`
            } else {
                // last stychera of 9th hour on Epiphany.
                // menaion has here "glory and now" and stychera once, so we do that
                res += `<i>${verses[i-3]}* ${verses[i-2]}</i><br><br>
                    ${stichera}<br>`

            }
        }

        // prokimen
        res += `<div class="subhead">Prokimenon</div><br>`;

        var  priestlyExclamationsData;
        if (priest === "1") {
            priestlyExclamationsData = await getData(`${address}\\horologion\\priestly_exclamations.json`);
            res += `
            ${priestlyExclamationsData["attentive"]}<br><br>
            ${priestlyExclamationsData["peace"]}<br><br>
            ${priestlyExclamationsData["wisdomAttentive"]}<br><br>`
            }

        const prokData = additionalElements["prokimenon"];

        res += `
            <div class="rubric">Tone ${prokData[0]}</div>
            <FONT COLOR="RED">Choir:</FONT> ${prokData[1]}* ${prokData[2]}<br>`;
        for (let verse of prokData.slice(3)){
            res += `<FONT COLOR="RED">v.</FONT> ${verse}<br><FONT COLOR="RED">Choir:</FONT> ${prokData[1]}* ${prokData[2]}<br>`
        }
        res += `
            <FONT COLOR="RED">v.</FONT> ${prokData[1]} <br><FONT COLOR="RED">Choir:</FONT> ${prokData[2]}<br><br>`

        // readings
        res += `<div class="subhead">Readings</div><br>`;
        const readingsData = additionalElements["readings"];
        for (let i of [0, 2]){
            if (priest === "1") {
                res += `
                ${priestlyExclamationsData["wisdom"]}<br><br>
                 <FONT COLOR="RED">Reader:</FONT> ${readingsData[i]}<br><br>
                ${ priestlyExclamationsData["attentive"]}<br><br>`
            } else {
                res += `<i>${readingsData[i]}</i><br><br>`;
            }
            res += readingsData[i+1] + "<br><br>";
        }

        if (priest === "1") {
            res += `
            ${priestlyExclamationsData["wisdomAttentive"]} ${priestlyExclamationsData["letUsGospel"]}<br><br>
            ${priestlyExclamationsData["peace"]}<br><br>
            ${priestlyExclamationsData["andWith"]}<br><br>
            ${priestlyExclamationsData["deacon"]} ${readingsData[4]}<br><br>
            ${gloryGospel}<br><br>
            ${priestlyExclamationsData["priest"]}
            <b>${readingsData[5]}</b><br><br>
            ${gloryGospel}<br><br>`
        } else {
            res += `<i>${readingsData[4]}</i><br><br>
                ${gloryGospel}<br><br>
                <div class="rubric">If Gospel is read by a layman, it is done without any chanting.</div>
                ${readingsData[5]}<br><br>
                ${gloryGospel}<br><br>`
        }

        return res;
    }

async function arrangeAdditionalElements(additionalElements, hour, priest) {

    if (additionalElements === undefined) {
        document.getElementById("additionalElementsSelector").innerHTML =  "";
        document.getElementById("additional_elements").innerHTML =  "";
        return
    }
    // Royal hours
    if ("psalms" in additionalElements) {
        document.getElementById("additionalElementsSelector").innerHTML = `<div class="subhead">Stichera</div><br>
          <label><input type="radio" name="selectStychera" value="1" checked> Repeat stichera as prescribed.</label><br>
          <label><input type="radio" name="selectStychera" value="0"> No repetitions.</label>
          <br><br>`
        document.getElementById("additional_elements").innerHTML = await arrangeRoyalHours(additionalElements, hour, priest);
        document.getElementById("additionalElementsSelector").addEventListener("change", async function () {document.getElementById("additional_elements").innerHTML = await arrangeRoyalHours(additionalElements, hour, priest)});
        return
    }
    // TODO Lent
    return ""
}

async function selectTropar(hour, dayOfWeek, hourData, glas, dayData, specialDayData, dayTriodionData){
   /*
       1: weekday
       3: day of month
       6: temple (do i put day again?)
       9: day of month

    Якщо ж в уставі буде подано більше, ніж два тропарі і більше, ніж один кондак,
    тоді вони беруться поперемінне, тобто:
    на  1-му і 6-му часі – тропар першої служби, відтак Слава: тропар другої служби;
    на 3-му і 9-му – тропар першої служби, а після – Слава: тропар третьої служби.

    1-му часі – тропар і кондак дня тижня, на 3-му і 9-му – святого, а на 6-му – храму.

    Неділя:
    на 1-му – тропар недільний один,
    на 3-му і 9-му – тропар недільний, відтак Слава: тропар святому;
    на 6-му – тропар недільний і Слава: тропар храму;

    Подібно і в перед- і посвяття господні і богородичні, як і для святих полієлейних,
    беруться їхні тропарі на кожнім часі, а тропар храму не береться.


    ----
    4, нд
    Тропарі: недільний – на всіх часах,
    також „Слава” на 3-му і 9-му – ще й святому, на 6-му – храму.
    Кондаки: на 1-му і 9-му – недільний, на 3-му – святому, на 6-му – храму.

    5, нд
    Якщо випаде два святі, то тропар недільний – на всіх часах,
    також „Слава” на 3-му і 6-му – святому, на 6-му – храму, на 9-му – другому.
    Кондаки – поперемінне, тобто: на 1-му – недільний, на 3-му – першому, на 6-му – храму, на 9-му – другому святому

    4, будень
    Тропарі і кондаки: на 1-му – дня тижня, на 3-му і 9-му – святого, на 6-му – храмуi.

    5, будень
    Якщо випаде два святі, то тропар і кондак
    на 1-му масі будуть дня тижня, на 3-му – першому святому, на 6-му – храму, на 9-му – другому святому

    4, сб
    Тропарі, за сьогоднішнім нашим звичаєм:
    на 1-му – тропар і кондак дня, на 3-му і 9-му – святого, на 6-му – храму.

    5, сб
    Якщо випаде два святі, то на 1-му і 6-му так, як з одним святим;
    на 3-му – тропар і кондак першому святому, на 9-му – другому

    8, нд
    На всіх часах: тропар недільний, також Слава: святому,
    кондаки – поперемінне, тобто: на 1-му і 6-му – недільний, на 3-му і 9-му – святому

    8, будень і сб
    На всіх часах: тропар і кондак святого.

    4, нд, передсвяття
    На всіх: тропар недільний, також Слава:
    на 1-му і 3-му – ще й передсвяття, на 6-му і 9-му – ще й святому.
    Кондак, недільний і свята, відмовляємо поперемінне, тобто
    на 1-му і на 6-му – передсвяття, а на 3-му і 9-му – недільний

    4, бдн, передсвяття
    На всіх: тропар передсвяття, також
    на 3-му і 9-му ще Слава: святому,
    кондаки – поперемінне, тобто: на 1-му і 6-му – передсвяття, на 3-му і 9-му – святому.

    5, бдн, передсвяття
    Якщо буде два святі, то на 3-му після Слава – тропар першому святому, а на 9-му – другому;
    кондаки: на 3-му – першому, на 9-му – другому святому

    8, нд, посвяття
    На всіх: тропар недільний, також Слава:
    на 1-му і 6-му – святу, на 3-му і 9-му – святому.
    кондак недільний, свята і святого поперемінне, тобто:
    на 1-му і 9-му – недільний, на 3-му – свята, на 6-му – святому.

    8, бдн, посвяття
    На всіх: тропар свята, Слава: святому;
    кондаки – поперемінно, тобто на 1-му і 6-му – свята, на 3-му і 9-му святому

    віддання свята в неділю
    На всіх: тропар недільний, Слава: свята;
    кондаки – поперемінне, тобто на 1-му і 6-му – недільний, на 3-му і 9-му – свята

    віддання в будень
    На всіх: тропар і кондак тільки свята, як у саме свято.
    */
    // fallback for now
    if (!dayData) {dayData = {"class": 0};  hour = "1hour";}
    var dayTrop;

    var prePostFeast = "";
    var prePostFeastTroparion = "";
    if ("forefeast" in dayData) {
        prePostFeast = "forefeast";
        prePostFeastTroparion = dayData["troparia"];
    } else if ("postfeast" in dayData) {
        prePostFeast = "postfeast";
        prePostFeastTroparion = (await getData(`${address}\\menaion\\${dayData["postfeast"]}.json`))["troparia"];
    }
    if (Array.isArray(prePostFeastTroparion)) {
        // we assume that in a list, the kontakion of a pre-feast is the last one
        // for the actual feast this handles the case if a kontakion is given in a 1-element list
        prePostFeastTroparion = prePostFeastTroparion[prePostFeastTroparion.length-1]
    }

    if (dayTriodionData != undefined && "troparia" in dayTriodionData && dayOfWeek === 6) {
        // for the deceased
        if (Array.isArray(dayTriodionData["troparia"])) return dayTriodionData["troparia"][0];
        else return dayTriodionData["troparia"];
    }

    // Sunday
    if (dayOfWeek === 0){
        const sundayTrop = await getData(`${address}\\octoechos\\sunday_troparia_kontakia.json`);

        if (specialDayData != undefined) {
            if (specialDayData["label"] === "after_nativity") {
                if (hour === "1hour" || hour === "6hour") {
                    return `${sundayTrop["troparia"][glas]}<br><br>${glory}<br><br>${prePostFeastTroparion}`;
                } else {
                    return `${sundayTrop["troparia"][glas]}<br><br>${glory}<br><br>${specialDayData["troparia"]}`;
                }
            } else if (hour === "1hour" || hour === "6hour" || specialDayData["label"] === "fathers") {
                return `${sundayTrop["troparia"][glas]}<br><br>${glory}<br><br>${specialDayData["troparia"]}`
            }
        }
        if (prePostFeast != ""){
            if (hour === "1hour" || hour === "6hour"){
                return `${sundayTrop["troparia"][glas]}<br><br>${glory}<br><br>${prePostFeastTroparion}`;
            }
            if ("troparia" in dayData) dayTrop = dayData["troparia"];
            else dayTrop = await getCommonText("troparia", dayData);
            if (!Array.isArray(dayTrop)) dayTrop = [dayTrop];
            if (hour === "3hour") return `${sundayTrop["troparia"][glas]}<br><br>${glory}<br><br>${dayTrop[0]}`;
            // 9th
            if (dayTrop.length === 1 && prePostFeast === "postfeast" || dayTrop.length === 2 && prePostFeast === "forefeast"){
                return `${sundayTrop["troparia"][glas]}<br><br>${glory}<br><br>${dayTrop[0]}`;
            } else {
                return `${sundayTrop["troparia"][glas]}<br><br>${glory}<br><br>${dayTrop[1]}`;
            }
        }

        if (hour === "1hour" && dayData["class"] < 8){
            return `${glory}<br><br>${sundayTrop["troparia"][glas]}`;
        }

        if ("troparia" in dayData) dayTrop = dayData["troparia"];
        else dayTrop = await getCommonText("troparia", dayData);
        if (!Array.isArray(dayTrop)) dayTrop = [dayTrop];

        if (dayData["class"] >= 8){
            // Sunday and polyeleos
            if (dayTrop.length === 1 || hour === "3hour" || hour === "9hour") {
                // 2 troparia for st Basil
                return `${sundayTrop["troparia"][glas]}<br><br>${glory}<br><br>${dayTrop[0]}`;
            }
            else {
                // 2 troparia for st Basil
                return `${sundayTrop["troparia"][glas]}<br><br>${glory}<br><br>${dayTrop[1]}`;
            }
        }

        if (hour === "6hour"){
            // There is no rubric outside the church in Dol.
            // In footnotes he quotes Greek practice, but I disagree with him that it matters.
            // In "Око Церковное" the order is different, but in its spirit,
            // the day's saint seems like the best choice.
            return `${sundayTrop["troparia"][glas]}<br><br>${glory}<div class="rubric">In a church, a troparion of the church. Otherwise:</div>${dayTrop[0]}`;
        }
        if (hour === "3hour"){
            return `${sundayTrop["troparia"][glas]}<br><br>${glory}<br><br>${dayTrop[0]}`;
        }
        // 9th hour: check if two saints
        if (dayTrop.length === 2) {
            return `${sundayTrop["troparia"][glas]}<br><br>${glory}<br><br>${dayTrop[1]}`;
        }
        return `${sundayTrop["troparia"][glas]}<br><br>${glory}<br><br>${dayTrop[0]}`;
    }

    // polyeleos or higher: at any hour return day troparion
    // in pre/post: feast-Glory-saint
    if ("troparia" in dayData) dayTrop = dayData["troparia"];
    else dayTrop = await getCommonText("troparia", dayData);
    if (!Array.isArray(dayTrop)) dayTrop = [dayTrop];
    if (dayData["class"] >= 8) {
        if (prePostFeast === ""){
            if (dayTrop.length === 1) return `${glory}<br><br>${dayTrop[0]}`;
            else return `${dayTrop[1]}<br><br>${glory}<br><br>${dayTrop[0]}`;
        } else {
            // pre post feast
            return `${prePostFeastTroparion}<br><br>${glory}<br><br>${dayTrop[0]}`;
        }
    }
    if (specialDayData!= undefined && specialDayData["label"] === "after_nativity") {
        // dec 26 is Monday, Sunday is transfered here
         return `${prePostFeastTroparion}<br><br>${glory}<br><br>${specialDayData["troparia"]}`;
    }

    if (prePostFeast != ""){
        if (hour === "1hour" || hour === "6hour"){
            return `${glory}<br><br>${prePostFeastTroparion}`;
        }
        if (hour === "3hour") {
            if (dayTrop.length > 1 || prePostFeast === "postfeast") return `${prePostFeastTroparion}<br><br>${glory}<br><br>${dayTrop[0]}`;
            else return `${glory}<br><br>${prePostFeastTroparion}`;
        }
        // 9th
        if ((dayTrop.length === 1 && prePostFeast === "postfeast") || (dayTrop.length === 2 && prePostFeast === "forefeast")) {
            return `${prePostFeastTroparion}<br><br>${glory}<br><br>${dayTrop[0]}`;
        } else if (dayTrop.length > 1) {
            return `${prePostFeastTroparion}<br><br>${glory}<br><br>${dayTrop[1]}`;
        } else {
            return `${glory}<br><br>${prePostFeastTroparion}`;
        }
    }

    // Friday is the same as Wednesday
    if (dayOfWeek === 5){dayOfWeek = 3;}

    // 1st hour: troparion of the weekday
    // this also functions as a fallback if there is no calendar day troparion
    if (hour == "1hour"){
        const data = await getData(`${address}\\horologion\\daily_troparia_kontakia.json`);
        var thisWeekayTropars = data["troparia"][dayOfWeek];
        const numWeekayTropars = thisWeekayTropars.length;
        if (numWeekayTropars === 1){
            return `${glory}<br><br>${thisWeekayTropars[0]}`;
        }
        else {
            return `${thisWeekayTropars[0]}<br><br>${glory}<br><br>${thisWeekayTropars[1]}`;
        }
    }

    // weekday
    if (hour === "6hour"){
        // see Sun for comment
        return `${glory}<div class="rubric">In a church, a troparion of the church. Otherwise:</div>${dayTrop[0]}`;
    }
    if (hour === "3hour"){
        return `${glory}<br><br>${dayTrop[0]}`;
    }
    // 9th hour: check if two saints
    if (dayTrop.length === 2) {
        return `${glory}<br><br>${dayTrop[1]}`;
    }
    return `${glory}<br><br>${dayTrop[0]}`;
}

async function selectKondak(hour, dayOfWeek, hourData, glas, dayData, specialDayData, dayTriodionData){
    /*
     Якщо ж в уставі буде подано більше, ніж два тропарі і більше, ніж один кондак,
    тоді вони беруться поперемінне, тобто:
    Кондаки, якщо буде їх два, беруться: один – на 1-му і 6-му часі,
    а другий – на 3-му і 9-му;
    якщо ж буде їх три, тоді на 1-му – перший, на 3-му – другий, на 6-му – третій, а на 9-му – знову перший.

    1-му часі – тропар і кондак дня тижня, на 3-му і 9-му – святого, а на 6-му – храму.

    Неділя:
    кондаки – поперемінне, тобто на 1-му – недільний, на 3-му – святому,
    на 6-му – храму і на 9-му – знову недільний.

    Подібно і в перед- і посвяття господні і богородичні, як і для святих полієлейних,
    беруться їхні тропарі на кожнім часі, а тропар храму не береться.

    For detailed rules, see the troparia function.
    */

    // fallback for now
    if (!dayData) {dayData = {"class": 0}; hour = "1hour";}

    var dayKond;

    var prePostFeast = "";
    var prePostFeastKontakion = "";
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

    if (specialDayData != undefined && prePostFeast === "") {
        if (dayData["class"] < 8 || hour === "1hour" || hour === "6hour") return specialDayData["kontakia"];
        return dayData["kontakia"];
    } else if (specialDayData != undefined && specialDayData["label"] === "after_nativity") {
        // different order
        if ((hour === "1hour" || hour === "6hour") && dayOfWeek === 0) return prePostFeastKontakion;
        else if ((hour === "1hour" || hour === "6hour") && dayOfWeek === 1) return dayData["kontakia"][0];
        return specialDayData["kontakia"];
    } else if (specialDayData != undefined) {
        if (hour === "1hour" || hour === "6hour") return specialDayData["kontakia"];
        return prePostFeastKontakion;
    }

    if (dayTriodionData != undefined && dayData["class"] >= 8 && dayOfWeek === 0) {
        if (hour === "1hour" || hour === "9hour") {
            const sundayKond = await getData(`${address}\\octoechos\\sunday_troparia_kontakia.json`);
            return sundayKond["kontakia"][glas];
        }
        if (hour === "3hour") return dayTriodionData["kontakia"];
        if (hour === "6hour") {
            if (Array.isArray(dayData["kontakia"])) return dayData["kontakia"][0];
            else return dayData["kontakia"];
        }
    } else if (dayTriodionData != undefined) {
        return dayTriodionData["kontakia"];
    }

    if (dayData["class"] === 10 && dayData["kontakia"].length === 2 && prePostFeast === "") {
        // st Basil
        if (hour === "1hour" || hour === "6hour") return dayData["kontakia"][1];
        else return dayData["kontakia"][0]
    }

    // Sunday
    if (dayOfWeek === 0){
        const sundayKond = await getData(`${address}\\octoechos\\sunday_troparia_kontakia.json`);

        if (
            (prePostFeast === "" && hour === "1hour")
            || (prePostFeast != "" && dayData["class"] >= 8 && (hour === "1hour" || hour === "9hour" ))
            || (prePostFeast != "" && dayData["class"] < 8 && (hour === "3hour" || hour === "9hour" ))
            || (prePostFeast === "" && hour === "6hour" && dayData["class"] >= 8)
        ){
            return `${sundayKond["kontakia"][glas]}`;
        }

        if (prePostFeast != "" && dayData["class"] >= 8 && hour === "3hour") {
            return prePostFeastKontakion;
        } else if (prePostFeast != "" && dayData["class"] < 8 && (hour === "1hour") || (hour === "6hour")) {
            return prePostFeastKontakion;
        }

        if (prePostFeast === "" && hour === "6hour"){
            // There is no rubric outside the church in Dol.
            // In footnotes he quotes Greek practice, but I disagree with him that it matters.
            // In "Око Церковное" the order is completely different.
            // So I am just balancing it out: as much Sunday as saints.
            // For weekdays, taking the first saint, inspiring a bit from Oko.
            // For polyeleos and higher that is actually the rubric.
            return `<div class="rubric">In a church, a kontakion of the church. Otherwise:</div>${sundayKond["kontakia"][glas]}`;
        }

        if ("kontakia" in dayData) dayKond = dayData["kontakia"];
        else dayKond = await getCommonText("kontakia", dayData);
        if (!Array.isArray(dayKond)) dayKond = [dayKond];

        if (prePostFeast != "" && dayData["class"] >= 8 && hour === "6hour") {
            return dayKond[0];
        }

        // 9th hour: check if two saints
        if (hour === "9hour" && dayKond.length === 2) {
            return `${dayKond[1]}`;
        }
        // 3rd or 9th with 1 saint
        return `${dayKond[0]}`;
    }

    if (prePostFeast != ""){
        if (hour === "1hour" || hour === "6hour"){
            return prePostFeastKontakion;
        }
    }

    if (hour === "1hour" && dayData["class"] < 8){
        const data = await getData(`${address}\\horologion\\daily_troparia_kontakia.json`);
        return `${data["kontakia"][dayOfWeek][0]}`;
    }

    if ("kontakia" in dayData) dayKond = dayData["kontakia"];
    else dayKond = await getCommonText("kontakia", dayData);
    if (!Array.isArray(dayKond)) dayKond = [dayKond];

    if (dayData["class"] >= 8){
        return `${dayKond[0]}`;
    }

    if (hour === "6hour"){
        return `<div class="rubric">In a church, a kontakion of the church. Otherwise:</div>${dayKond[0]}`;
    }

    // 9th hour: check if two saints
    if (hour === "9hour" && dayKond.length === 2) {
        return `${dayKond[1]}`;
    }
    // 3rd or 9th with 1 saint
    return `${dayKond[0]}`;
}