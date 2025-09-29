import { usualBeginning, tripleAlleluia, glory, andNow, trisagionToPater, prayerOfTheHours, LHM, comeLetUs, gloryAndNow, moreHonorable, inTheName, prayerBlessingMayGodBeGracious, endingBlockMinor, amen } from './text_generation.js';
import { parseDate, getData } from './script.js';
var address = `Text\\English`

export function minorHour(hour, priest, full, date){
	var chosenDate = new Date(date);
	// it seems, days are shifted. now, Sunday is 7
	var dayOfWeek = chosenDate.getDay() + 1;
	var season, seasonToShow, glas;
	[season, seasonToShow, glas] = parseDate(chosenDate);
	const dateAddress = `${String(chosenDate.getMonth() + 1).padStart(2, "0")}\\${String(chosenDate.getDate()+1).padStart(2, "0")}`

	const numeral = {
		1: "First",
		3: "Third",
		6: "Sixth",
		9: "Ninth"
	}
	var numOhHour = hour.charAt(0);

	loadText(hour, full, dayOfWeek, glas, dateAddress);
	return `<h2>The ${numeral[numOhHour]} hour</h2>
	<div class=rubric>Should this hour be said immediately after the previous one, omit this beginning:</div>
	<hr>
	${usualBeginning(priest, season)}
	<hr>
	${comeLetUs}<br><br>
	<div id="psalms"></div><br>
	${tripleAlleluia}<br>
	<div id="troparia"></div>
	${andNow}
	<div id="theotokion"></div><br>
	<div id="chapter"></div><br>
	${trisagionToPater(priest)}<br>
	<div id="kontakia"></div><br>
	${LHM} <FONT COLOR="RED">(40)</FONT><br>
	${prayerOfTheHours}<br>
	${LHM} <FONT COLOR="RED">(3)</FONT><br>
	${gloryAndNow}
	${moreHonorable}<br><br>
	${inTheName}<br>
	${prayerBlessingMayGodBeGracious(priest)}<br>
	${amen}
	<div id="prayer"></div><br>
	<div class=rubric>When this hour is followed by another one, switch to the next hour here. Otherwise, conclude with the dismissal:</div>
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
        var err = "<div class=rubric>The proper canon for today is not yet added, please use the default one:</div>"
    }

    if (full === "1") {
         const  psalmData = await Promise.all(
            psalmPaths.map(async path => {
                const resp = await fetch(path);
                return resp.text();
            })
        );
        var formattedValues = ""
        for (const [i, psalm] of  psalmData.entries()){
            formattedValues += `<div class="subhead">Psalm ${psalmNums[i]}</div>${psalm}`
        }
        document.getElementById("psalms").innerHTML = formattedValues;

    } else if (full === "0") {
        var i = dayOfWeek%4 - (dayOfWeek < 4)
        if (dayOfWeek === 7){
            i = 2
        }
        const n = psalmNums[i];
        const resp = await fetch(psalmPaths[i]);
        const  psalmData = await resp.text();
        console.log(i, dayOfWeek)

        document.getElementById("psalms").innerHTML = `<div class="subhead">Psalm ${n}</div>${ psalmData}`;
    }
    selectTropar(dayOfWeek, psalmData, glas, dayData).then(tropar => {
        document.getElementById("troparia").innerHTML = tropar;
    });
    selectKondak(hour, dayOfWeek, psalmData, glas, dayData).then(kondak => {
        document.getElementById("kontakia").innerHTML = kondak;
    });
    document.getElementById("theotokion").innerHTML = psalmData["theotokion"]
    document.getElementById("chapter").innerHTML = psalmData["chapter"]
    document.getElementById("prayer").innerHTML = psalmData["prayer"]

}

async function selectTropar(dayOfWeek, hourData, glas){
    //TODO make one function for tropar and kondak?
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

    if (dayOfWeek === 7){
        // Sunday first
        const data = await getData(`${address}\\octoechos\\sunday_troparia_kontakia.json`);
        return `${glory}<br>${data["troparia"][glas]}`;
    }

    // Friday is the same as Wednesday
    if (dayOfWeek === 5){dayOfWeek = 3;}
    // read the data
    const data = await getData(`${address}\\horologion\\daily_troparia_kontakia.json`);
    if (!data){
        // fallback for now
        return hourData["lenten_troparia"]
    }
    //TODO expand beyond the weekdays
    var thisDayTropars = data["troparia"][dayOfWeek];
    const numTropars = thisDayTropars.length;
    if (numTropars === 1){
        return `${glory}<br>${thisDayTropars[0]}`;
    }
    else {
        return `${thisDayTropars[0]}<br>${glory}<br>${thisDayTropars[1]}`;
    }
}

async function selectKondak(hour, dayOfWeek, hourData, glas){
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
    */
    if (dayOfWeek === 7){
        // Sunday first
        const data = await getData(`${address}\\octoechos\\sunday_troparia_kontakia.json`);
        return `${data["kontakia"][glas]}`;
    }

    // Friday is the same as Wednesday
    if (dayOfWeek === 5){dayOfWeek = 3;}
    const data = await getData(`${address}\\horologion\\daily_troparia_kontakia.json`);
    if (!data){
        // fallback for now
        return hourData["lenten_kontakion"]
    }
    var thisDayTropars = data["kontakia"][dayOfWeek];
    const numTropars = thisDayTropars.length;
    var numOfHour = hour.charAt(0);
    if (numTropars === 1 || numOfHour === "1"){
        // 1st hour always gets first k
        return `${thisDayTropars[0]}`;
    }
    else if (numOfHour === "6"){
              return `${thisDayTropars[0]}`;
        }
    else
    {
        return `${thisDayTropars[1]}`;
    }
}