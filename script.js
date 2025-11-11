import {forefeast, postfeast} from './text_generation.js';
var address = `Text\\English`

export function dateToStr(currentDate){
    const yyyy = currentDate.getFullYear();
    const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
    const dd = String(currentDate.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

export function setDefaultHour(currentDate) {
	var currentTime = currentDate.getHours();
	var DefaultHour;
	if (currentTime < 3){
		DefaultHour = document.getElementById('midnight');
	} else if (currentTime < 6) {
		DefaultHour = document.getElementById('matins');
	} else if (currentTime < 8) {
		DefaultHour = document.getElementById('1hour');
	} else if (currentTime < 11) {
		DefaultHour = document.getElementById('3hour');
	} else if (currentTime < 14) {
		DefaultHour = document.getElementById('6hour');
	} else if (currentTime < 17) {
		DefaultHour = document.getElementById('9hour');
	} else if (currentTime < 21) {
		DefaultHour = document.getElementById('vespers');
	} else {
		DefaultHour = document.getElementById('compline');
	}
	DefaultHour.checked = true;
	displayCurrentDay(dateToStr(currentDate));
}

export async function displayCurrentDay(currentDate){
    var season, seasonToShow, glas;
    let [year, month, day] = currentDate.split("-").map(Number);
	[season, seasonToShow, glas] = parseDate(year, month, day);
	document.getElementById("date-container").innerHTML = seasonToShow;
    document.getElementById("date-name").innerHTML = await showMenaionDate(month, day);

    let nextDate = new Date(year, month - 1, day);
    nextDate.setDate(nextDate.getDate() + 1);
    let [next_year, next_mm, next_dd] = nextDate.toISOString().slice(0, 10).split("-").map(Number);
    document.getElementById("next-date-name").innerHTML = await showMenaionDate(next_mm, next_dd);

}

async function showMenaionDate(mm, dd){
    mm = String(mm).padStart(2, "0")
    dd = String(dd).padStart(2, "0")
	const dateAddress = `${mm}\\${dd}`
    {
        const dayData = await getData(`${address}\\menaion\\${dateAddress}.json`);
        const symbolData = await getData(`${address}\\menaion\\feasts_symbols.json`);
        var feastName = "";
        var note = "";
        if ("forefeast" in dayData) {
            let feast = (await getData(`${address}\\menaion\\${dayData["forefeast"]}.json`))["name"];
            feastName = `${forefeast} ${feast}, `;
        }
        if ("postfeast" in dayData) {
            feastName = `${postfeast} ${(await getData(`${address}\\menaion\\${dayData["postfeast"]}.json`))["name"]}, `;
        }
        if ("note" in dayData) {
            note = `<br><div class="rubric">${dayData["note"]}</div>`
        }
        return `${symbolData[dayData["class"]]} ${dd}/${mm}: ${feastName} ${constructDayName(dayData)}${note}`;
//    } catch (error) {
//         return `No data for this day at ${address}\\menaion\\${dateAddress}.json`
    }
}

export function constructDayName(dayData){
    if (!Array.isArray(dayData["type"])) {
        // one saint
        return `Saint ${dayData["type"]} ${dayData["name"]}`
    } else {
        // list of saints
        var dateInfo = ``;
        for (let [i, name] of dayData["name"].entries()){
            dateInfo += ` Saint ${dayData["type"][i]} ${name},`
        }
        return dateInfo.slice(0, -1);
    }
}

function calculateEaster(year) {
	// from 1876 Nature from wiki
	var a = year%19;
	var b = Math.floor(year/100);
	var c = year%100;
	var d = Math.floor(b/4);
	var e = b%4;
	var g = Math.floor((8*b + 13)/25);
	var h = (19*a + b - d - g + 15)%30;
	var i = Math.floor(c/4);
	var k = c%4;
	var l = (32 + 2*e + 2*i - h - k) % 7;
	var m = Math.floor((a + 11*h + 19*l)/433);
	var month = Math.floor((h + l - 7*m + 90)/25);
	var date = (h + l - 7*m + 33*month + 19) % 32;
	return [month, date];
}

function dateDiffInDays(a, b) {
  const _MS_PER_DAY = 1000 * 60 * 60 * 24;
  // Discard the time and time-zone information.
  const utcA = Date.UTC(a[0], a[1]-1, a[2]);
  const utcB = Date.UTC(b[0], b[1]-1, b[2]);

  return Math.floor((utcA - utcB) / _MS_PER_DAY);
}


export function getDayInfo(date, evening){
    let [year, mm, dd] = date.split("-").map(Number);
    // we pass it like this, to avoid the date being created at UTC time
    let thisDay = new Date(year, mm-1, dd);
    // shift the day in the evening
    if (evening) thisDay.setDate(thisDay.getDate() + 1);
    [year, mm, dd] = thisDay.toISOString().slice(0, 10).split("-").map(Number);

	let [season, seasonToShow, glas] = parseDate(year, mm, dd);
	var dayOfWeek = thisDay.getDay();

	const dateAddress = `${String(mm).padStart(2, "0")}\\${String(dd).padStart(2, "0")}`
	return [year, mm, dd, season, glas, dayOfWeek, dateAddress];
}

export function parseDate(currentYear, currentMonth, currentDay) {
	var thisEasterMonth, thisEasterDay, lastEasterMonth, lastEasterDay
	[thisEasterMonth, thisEasterDay] = calculateEaster(currentYear);
	const diffFromEaster = dateDiffInDays([currentYear, currentMonth, currentDay], [currentYear,thisEasterMonth,thisEasterDay]);
	var glas, season, seasonToShow;
	glas = Math.floor((diffFromEaster)/7)%8;
	if (glas === 0) glas = 8;

	if (diffFromEaster == 0) {
		glas = 1;
		season = "EasterDay";
		seasonToShow = "Easter Day";
	} else if (diffFromEaster > 0 & diffFromEaster < 7) {
		glas = 1;  // TODO: should depend on the day
		season = "EasterWeek";
		seasonToShow = "Easter Week";
	} else if (diffFromEaster >= 7 & diffFromEaster <= 56) {
		seasonToShow = `${glas} week after Easter`;
		season = "Pentecost";
	} else if (diffFromEaster > 56 & diffFromEaster < 365+34) {  
		// TODO: account for post-Union feasts that are in Triodion but after 8 weeks
		seasonToShow = `Week of tone ${glas}`;
		season = "0";
	} else {  // TODO: break into cases
		[lastEasterMonth, lastEasterDay] = calculateEaster(currentYear-1);
		const diffFromLastEaster = dateDiffInDays([currentYear, currentMonth, currentDay], [currentYear-1,lastEasterMonth,lastEasterDay]);
		if (diffFromEaster > -49) {
			seasonToShow = `${7 + Math.floor(diffFromEaster/7)} week of Lent,`;
		    season = "Lent";
		} else if (diffFromEaster >= -70) {
			seasonToShow = `${10 + Math.floor(diffFromEaster/7)} week of Forelent,`;
			season = "Forelent";
		} else {
            seasonToShow = `Week of tone ${glas}`;
            season = "0";
		}
	}
	return [season, seasonToShow, glas];
}

export function isBetweenDates(month, day, startMonth, startDay, endMonth, endDay) {
  // make it a 4-digit number and compare
  const md = Number(month) * 100 + Number(day);
  const start = Number(startMonth) * 100 + Number(startDay);
  const end = Number(endMonth) * 100 + Number(endDay);

  if (start <= end) {
    // normal case (e.g., March 1 → June 1)
    return md >= start && md <= end;
  } else {
    // wrap-around case (e.g., Dec 10 → Jan 15)
    return md >= start || md <= end;
  }
}


export async function getData(filename) {
    // Async function to fetch JSON
    const res = await fetch(filename);
    return res.json();
}

export function replaceCapsWords(text, replacementsDict) {
    // Match ALLCAPS words and replace if found in replacements
    return text.replace(/\b[A-Z_]+\b/g, (match) => {
        return match in replacementsDict ? replacementsDict[match] : match;
    });
}


export async function readPsalmsFromNumbers(psalmNums, psalmHeaders){
    const psalmPaths = psalmNums.map(n => `${address}\\psalms\\${n}.txt`);
    const psalmData = await Promise.all(
        psalmPaths.map(async path => {
            const resp = await fetch(path);
            return resp.text();
        })
    )

    var formattedValues = [];
    var header;
    for (const [i, psalm] of  psalmData.entries()){
        if (psalmHeaders){
            header = psalmHeaders[i];
        } else {
            header = `Psalm ${psalmNums[i]}`;
        }
        formattedValues.push(`<div class="subhead">${header}</div>`);
        formattedValues.push(psalm);  // TODO add 2 <br>
    }
    return formattedValues;
}