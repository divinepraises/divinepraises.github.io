import { usualBeginning, tripleAlleluia, glory, andNow, trisagionToPater, prayerOfTheHours, LHM, comeLetUs, gloryAndNow, moreHonorable, inTheName, prayerBlessingMayGodBeGracious, endingBlockMinor, amen, getCommonText } from './text_generation.js';
import { getDayInfo, getData, readPsalmsFromNumbers, replaceCapsWords } from './script.js';
const address = `Text\\English`

export function minorHour(hour, priest, full, date){
	let [year, mm, dd, season, glas, dayOfWeek, dateAddress] = getDayInfo(date, false);

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
	var numOhHour = hour.charAt(0);
	const linkToNext = `https:\/\/divinepraises.github.io/main.html?hour=${nextHour[numOhHour]}&priest=${priest}&full=${full}&date=${date}#come_let_us`;

	loadText(hour, full, dayOfWeek, glas, dateAddress);
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
	<div class="subhead">Prayer of this hour</div>
	<div id="prayer"></div><br>
	<div class=rubric>When this hour is followed by another one, switch to the <a href="${linkToNext}">next hour</a>. Otherwise, conclude with the dismissal:</div>
	<hr>
	${endingBlockMinor(priest)}
	`;
}

async function loadText(hour, full, dayOfWeek, glas, date) {
	const psalmData = await getData(`${address}\\horologion\\${hour}.json`);
	const psalmNums = psalmData["psalms"];
	const psalmPaths = psalmNums.map(n => `${address}\\psalms\\${n}.txt`);
    var dayData;
	try{
        var err = ""
        dayData = await getData(`${address}\\menaion\\${date}.json`);
    } catch (error) {
        console.log("No data for the day! Using the weekday troparia.")
    }

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
    selectTropar(hour, dayOfWeek, psalmData, glas, dayData).then(tropar => {
        document.getElementById("troparia").innerHTML = tropar;
    });
    selectKondak(hour, dayOfWeek, psalmData, glas, dayData).then(kondak => {
        document.getElementById("kontakia").innerHTML = kondak;
    });
    document.getElementById("theotokion").innerHTML = psalmData["theotokion"]
    document.getElementById("chapter").innerHTML = psalmData["chapter"]
    document.getElementById("prayer").innerHTML = psalmData["prayer"]

}

async function selectTropar(hour, dayOfWeek, hourData, glas, dayData){
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

    // Sunday
    if (dayOfWeek === 0){
        const sundayTrop = await getData(`${address}\\octoechos\\sunday_troparia_kontakia.json`);

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
            return `${sundayTrop["troparia"][glas]}<br><br>${glory}<br><br>${dayTrop[0]}`;
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
    if (dayData["class"] >= 8){
        if (prePostFeast === "") return `${glory}<br><br>${dayTrop[0]}`;
        return `${prePostFeastTroparion}<br><br>${glory}<br><br>${dayTrop[0]}`;
    }

    if (prePostFeast != ""){
        if (hour === "1hour" || hour === "6hour"){
            return `${glory}<br><br>${prePostFeastTroparion}`;
        }
        if (hour === "3hour") return `${prePostFeastTroparion}<br><br>${glory}<br><br>${dayTrop[0]}`;
        // 9th
        if (dayTrop.length === 1 && prePostFeast === "postfeast" || dayTrop.length === 2 && prePostFeast === "forefeast"){
            return `${prePostFeastTroparion}<br><br>${glory}<br><br>${dayTrop[0]}`;
        } else {
            return `${prePostFeastTroparion}<br><br>${glory}<br><br>${dayTrop[1]}`;
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

async function selectKondak(hour, dayOfWeek, hourData, glas, dayData){
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