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
	displayCurrentDay(currentDate);
}

export function displayCurrentDay(currentDate){
    var season, seasonToShow, glas;
	[season, seasonToShow, glas] = parseDate(currentDate);
	document.getElementById("date-container").innerHTML = seasonToShow;
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
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return Math.floor((utcA - utcB) / _MS_PER_DAY);
}

export function parseDate(currentDate) {
	var currentYear = currentDate.getFullYear();
	var currentMonth = currentDate.getMonth();
	var currentDay = currentDate.getDate();
	var thisEasterMonth, thisEasterDay, lastEasterMonth, lastEasterDay
	[thisEasterMonth, thisEasterDay] = calculateEaster(currentYear);
	const thisYearEaster = new Date(`${currentYear}-${thisEasterMonth}-${thisEasterDay}`);
	const diffFromEaster = dateDiffInDays(currentDate, thisYearEaster);
	var glas, season, seasonToShow;
	if (diffFromEaster == 0) {
		glas = 1;
		season = "EasterDay";
		seasonToShow = "Easter Day";
	} else if (diffFromEaster > 0 & diffFromEaster < 7) {
		glas = 1;  // TODO: should depend on the day
		season = "EasterWeek";
		seasonToShow = "Easter Week";
	} else if (diffFromEaster >= 7 & diffFromEaster <= 56) {
		glas = Math.floor(diffFromEaster/7)%8;
		seasonToShow = `${glas} week after Easter`;
		season = "Pentecost";
	} else if (diffFromEaster > 56 & diffFromEaster < 365+34) {  
		// TODO: account for post-Union feasts that are in Triodion but after 8 weeks
		glas = Math.floor(diffFromEaster/7)%8;
		seasonToShow = `Week of tone ${glas}`;
		season = "0";
	} else {  // TODO: break into cases
		[lastEasterMonth, lastEasterDay] = calculateEaster(currentYear-1);
		const lastYearEaster = new Date(`${currentYear-1}-${lastEasterMonth}-${lastEasterDay}`);
		const diffFromLastEaster = dateDiffInDays(currentDate, lastYearEaster);
		glas = Math.floor(diffFromLastEaster/7)%8;
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
	if (glas == 0) {
		glas = 8;
	}
	return [season, seasonToShow, glas];
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
