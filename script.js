import {forefeast, postfeast, st, tripleAlleluia, LHM, gloryAndNow} from './text_generation.js';
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
    var season, seasonWeek, seasonToShow, glas, dayOfWeek;
    let [year, month, day] = currentDate.split("-").map(Number);
	[season, seasonWeek, seasonToShow, glas] = parseDate(year, month, day);
	let thisDate = new Date(year, month - 1, day);
	dayOfWeek = thisDate.getDay();
	document.getElementById("date-container").innerHTML = seasonToShow;
    document.getElementById("date-name").innerHTML = await showMenaionDate(year, month, day, season, seasonWeek, dayOfWeek);
    
    thisDate.setDate(thisDate.getDate() + 1);
    let [next_year, next_mm, next_dd] = thisDate.toISOString().slice(0, 10).split("-").map(Number);
    let [next_season, next_seasonWeek, next_seasonToShow, next_glas] = parseDate(next_year, next_mm, next_dd);
    let next_dayOfWeek = thisDate.getDay();
    document.getElementById("next-date-name").innerHTML = await showMenaionDate(next_year, next_mm, next_dd, next_season, next_seasonWeek, next_dayOfWeek);
}

export async function specialSunday(month, day){
    const specialSundays = await getData(`${address}\\menaion\\special_sundays.json`);
    if (!(month in specialSundays)) return;
    for (let [specialName, [first, last]] of Object.entries(specialSundays[month])){
        if (isBetweenDates(month, day, month, first, month, last)){
            return specialName;
        }
    }
}

async function showMenaionDate(yyyy, mm, dd, season, seasonWeek, dayOfWeek){
    yyyy = String(yyyy);
    mm = String(mm).padStart(2, "0");
    dd = String(dd).padStart(2, "0");
	const dateAddress = `${mm}\\${dd}`;

    var specialName = "";
	if ((new Date(`${yyyy}-${mm}-${dd}`)).getUTCDay() === 0) {
	    const specialSundayName = await specialSunday(mm, dd);
	    if (specialSundayName != undefined) {
	        const sundayData = await getData(`${address}\\menaion\\${mm}\\${specialSundayName}.json`);
	        if ("day name" in sundayData) specialName = sundayData["day name"];
	        else specialName = sundayData["name"];
	    }
	}
	if (season != "0") {
	    try {
	        let dayTriodionData = await getData(`${address}\\triodion\\${season}\\${seasonWeek-1}${dayOfWeek}.json`);
	        specialName = dayTriodionData["day name"] + ". ";
	    } catch {}
	}
    try {
        const dayData = await getData(`${address}\\menaion\\${dateAddress}.json`);
        const symbolData = await getData(`${address}\\menaion\\feasts_symbols.json`);
        var feastName = "";
        var note = "";
        var dayName;

        if ("forefeast" in dayData) {
            let feast = await getData(`${address}\\menaion\\${dayData["forefeast"]}.json`);
            if ("day name" in feast) feastName = `${forefeast} ${feast["day name"]}, `;
            else feastName = `${forefeast} ${feast["name"]}, `;
        }
        if ("postfeast" in dayData) {
            if (!(mm === "02" && cancelPostfeastHypapante(dd, season, seasonWeek, dayOfWeek))) {
                let feast = await getData(`${address}\\menaion\\${dayData["postfeast"]}.json`);
                if ("day name" in feast) feastName = `${postfeast} ${feast["day name"]}, `;
                else feastName = `${postfeast} ${feast["name"]}, `;
            }
        }
        if ("note" in dayData) {
            note = `<br><div class="rubric">${dayData["note"]}</div>`
        }
        if (
            (dayData["class"] <= 6 && season === "Forelent" && (dayOfWeek === 0 || dayOfWeek === 6 && seasonWeek === 2))
            ||(dayData["class"] <= 6 && season === "Lent" && (dayOfWeek === 0 && seasonWeek != 2 || dayOfWeek === 6 && seasonWeek === 1))
        ) {
            dayName = "";
        } else dayName = constructDayName(dayData, false);

        return `${symbolData[dayData["class"]]} ${dd}/${mm}: ${feastName} ${specialName} ${dayName}${note}`;
    } catch (error) {
         return `No data for this day at ${address}\\menaion\\${dateAddress}.json`
    }
}

export function constructDayName(dayData, forDismissal=true){
    var saint;
    if ("saint" in dayData) saint = dayData["saint"];
    else saint = st;

    if (!forDismissal && "day name" in dayData) {
        var dayNames = dayData["day name"];
        if (!Array.isArray(dayNames)) {
            return dayNames;
        } else {
            var dateInfo = ``;
            if (!Array.isArray(saint)) {saint = Array(dayNames.length).fill(saint)}
            for (let [i, name] of dayNames.entries()){
                if (name != "") {dateInfo += `${name}`; continue;}
                dateInfo += `${saint[i]} ${dayData["type"][i]} ${dayData["name"][i]}`
                if (i != dayNames.length-1) dateInfo += `, `
            }
            return dateInfo;
        }
    }
    if (!Array.isArray(dayData["type"])) {
        // no saints
        if (dayData["type"] === "" && dayData["name"] === "") return "";
        // one saint
        return `${saint} ${dayData["type"]} ${dayData["name"]}`
    } else {
        // list of saints
        var dateInfo = ``;
        if (!Array.isArray(saint)) {saint = Array(dayData["name"].length).fill(saint)}
        for (let [i, name] of dayData["name"].entries()){
            dateInfo += ` ${saint[i]} ${dayData["type"][i]} ${name},`
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

	let [season, seasonWeek, seasonToShow, glas] = parseDate(year, mm, dd);
	var dayOfWeek = thisDay.getDay();

	const dateAddress = `${String(mm).padStart(2, "0")}\\${String(dd).padStart(2, "0")}`
	return [year, mm, dd, season, seasonWeek, glas, dayOfWeek, dateAddress];
}

export function parseDate(currentYear, currentMonth, currentDay) {
	var thisEasterMonth, thisEasterDay, lastEasterMonth, lastEasterDay
	[thisEasterMonth, thisEasterDay] = calculateEaster(currentYear);
	const diffFromEaster = dateDiffInDays([currentYear, currentMonth, currentDay], [currentYear,thisEasterMonth,thisEasterDay]);
	var glas, season, seasonToShow, seasonWeek;
	glas = Math.floor((diffFromEaster)/7)%8;
	if (glas === 0) glas = 8;

	if (diffFromEaster == 0) {
		glas = 1;
		season = "EasterDay";
		seasonWeek = 0;
		seasonToShow = "<FONT COLOR=\"gold\">Easter Day</FONT>";
	} else if (diffFromEaster > 0 & diffFromEaster < 7) {
		glas = 1;  // TODO: should depend on the day
		season = "EasterWeek";
		seasonWeek = 0;
		seasonToShow = "<FONT COLOR=\"gold\">Easter Week</FONT>";
	} else if (diffFromEaster >= 7 & diffFromEaster <= 56) {
		seasonToShow = `${glas} week after Easter`;
		seasonWeek = glas;
		season = "Pentecost";
	} else if (diffFromEaster > 56 & diffFromEaster < 365+34) {  
		// TODO: account for post-Union feasts that are in Triodion but after 8 weeks
		seasonToShow = `Week of tone ${glas}`;
		seasonWeek = glas;
		season = "0";
	} else {  // TODO: break into cases
		[lastEasterMonth, lastEasterDay] = calculateEaster(currentYear-1);
		const diffFromLastEaster = dateDiffInDays([currentYear, currentMonth, currentDay], [currentYear-1,lastEasterMonth,lastEasterDay]);
		var dd;
		if (diffFromLastEaster % 7 === 0) dd = "Sunday"
		else dd = "week"
		if (diffFromEaster >= -7) {
			glas = Math.floor((diffFromLastEaster)/7)%8;
			if (glas === 0) glas = 8;
			seasonToShow = `<FONT COLOR="DarkViolet">Holy Week</FONT>`;
		    season = "HolyWeek";
		    seasonWeek = 0;
		} else if (diffFromEaster > -49) {
			glas = Math.floor((diffFromLastEaster)/7)%8;
			if (glas === 0) glas = 8;
			seasonWeek = 7 + Math.floor(diffFromEaster/7);
			if (dd === "week") seasonWeek += 1;
			seasonToShow = `<FONT COLOR="DarkViolet">${seasonWeek} ${dd} of Lent</FONT>`;
		    season = "Lent";
		} else if (diffFromEaster >= -70) {
			glas = Math.floor((diffFromLastEaster)/7)%8;
			if (glas === 0) glas = 8;
			seasonWeek = 10 + Math.floor(diffFromEaster/7) + 1;
			seasonToShow = `${seasonWeek} ${dd} of Forelent`;
			season = `Forelent`;
		} else {
			glas = Math.floor((diffFromLastEaster)/7)%8;
			if (glas === 0) glas = 8;
            seasonToShow = `Week of tone ${glas}`;
            season = "0";
            seasonWeek = glas;
		}
	}
	return [season, seasonWeek, seasonToShow, glas];
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

export function cancelPostfeastHypapante(dd_str, season, seasonWeek, dayOfWeek) {
    const dd = Number(dd_str);
    /// explore all options and return a bool that tells whether the postfeast of hypapante should be cancelled
    if (season === "0") return false
    if (season === "Lent") return true
    if (
        (seasonWeek === 2 && dayOfWeek === 6) ||  // meatfare sat no matter what calendar date
        (dd === 6 && (seasonWeek === 4 || seasonWeek === 3 && (dayOfWeek === 5 || dayOfWeek === 3))) ||
        (dd === 7 && (seasonWeek === 4 || seasonWeek === 3 && dayOfWeek != 1 && dayOfWeek != 2)) ||
        (dd === 8 && (seasonWeek === 4 || seasonWeek === 3 && dayOfWeek != 1)) ||
        (dd === 9 && seasonWeek >= 3)
    ) return true
    return false
}

export async function kathismaToText(k, isGreatVespers, dayOfWeek) {
    // replace with readPsalmsFromNumbers when psalms are here
    var kathPsalms = await getData(`${address}\\psalms\\kathismas.json`);
    var fistStasisOnly = (isGreatVespers && dayOfWeek != 0);
    var kathPsalmsToText = `
        <div class="rubric">
            You can read the appointed kathisma
            <a href="https://www.liturgy.io/orthodox-psalter?kathisma=${k}" target="_blank" rel="noopener noreferrer">at this web site</a>`
    if (fistStasisOnly) kathPsalmsToText += ` (today only the first stasis is said)`
    kathPsalmsToText += ` or take psalms as given below from your psalter.</div><br>`
    for (const [i, stasis] of kathPsalms[k].entries()){
        kathPsalmsToText += `
        <div class="rubric">Psalms ${stasis} (in traditional/LXX numeration)</div>
        ${tripleAlleluia}`
        if (fistStasisOnly) break;
        if (i < 2) kathPsalmsToText += `${LHM} <FONT COLOR="RED">(3)</FONT><br>${gloryAndNow}`
    }
    return kathPsalmsToText;
}