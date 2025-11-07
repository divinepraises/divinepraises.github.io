import { getData, replaceCapsWords } from './script.js';
const address = `Text\\English`

const response = await fetch('./Text/English/horologion/general_texts.json');
const data = await response.json();

const cross = `<FONT COLOR="RED"><b>†</b></FONT>`

export const glory = `${cross} ${data.glory}.`

export const andNow = `${data.andNow}`

export const gloryAndNow = `${glory} ${andNow}`

export const LHM = `${data.lhm}`
export const GTL = `${data.gtl}`
export const TYL = `${data.tyl}`

export const moreHonorable = `${data.moreHonorable}`

export const inTheName = `${data.inTheName}`

export function trisagionToPater(priest){
    return `${cross} ${data.trisagion} <FONT COLOR="RED">(3)</FONT><br><br>
		${glory} ${andNow}<br><br>
		${data.trinity}<br><br>
		${data.lhm} <FONT COLOR="RED">(3)</FONT><br><br>
		${glory} ${andNow}<br><br>
		${data.ourFather}<br><br>
		${getOurFatherEnding(priest)}<br><br>
		<FONT COLOR="RED">Choir:</FONT> ${data.amen}<br><br>`;
}

export const tripleAlleluia = `${glory} ${andNow}<br>
	${cross} ${data.tripleAlleluia} <FONT COLOR="RED">(3)</FONT><br>`;

export function usualBeginning(priest, season){
 var HK;
 if (season === "Pentecost" || season === "ËasterWeek"){
  HK = "";
 } else {
  HK = `${data.heavenlyKing}<br>`;
 }
 return `${getBeginning(priest)}<br><br>
		<FONT COLOR="RED">Choir:</FONT> ${data.amen}<br><br>
		${data.gloryBeToYou}<br><br>
		${HK}<br>
		${trisagionToPater(priest)}
		${data.lhm} <FONT COLOR="RED">(12)</FONT><br><br>
		${glory} ${andNow}`;
}
export const comeLetUs = `${cross} ${data.clw1}<br><br>
		${cross} ${data.clw2}<br><br>
		${cross} ${data.clw3} `

export function getBeginning(withPriest) {
	if (withPriest == "1") {
		return `<FONT COLOR="RED">Priest:</FONT> <b>${data.blessedBeOurGod}</b> `;
	} else {
		return `<FONT COLOR="RED">Chariman:</FONT> ${data.zamolytv} `;
	};
}

function getOurFatherEnding(withPriest) {
	if (withPriest == "1") {
		return `<FONT COLOR="RED">Priest:</FONT> ${cross} <b>${data.forTheKingdom}</b> `;
	} else {
		return `<FONT COLOR="RED">Chariman:</FONT> ${data.JesusPrayer}`;
	};
}

export function prayerBlessingMayGodBeGracious(withPriest) {
	if (withPriest == "1") {
		return `<FONT COLOR="RED">Priest:</FONT> ${cross} <b>${data.mayGodBeGracious}</b> `;
	} else {
		return `<FONT COLOR="RED">Chariman:</FONT> ${data.zamolytv} `;
	};
}

export function giveTheBlessing(withPriest) {
	if (withPriest == "1") {
		return `${data.giveTheBlessing}`;
	} else {
		return `${data.LordBless}`;
	};
}

export function dismissalMajor(dayOfWeek, withPriest, isGreatVespers, saintNames) {
    var text;
    var replacements = {};
	if (withPriest == "1") {
		text = `<FONT COLOR="RED">Priest:</FONT> ${cross} <b>${data.priestDismissalMajor}</b> `;
	} else {
		text = `<FONT COLOR="RED">Chariman:</FONT> ${data.layDismissalMajor}`;
	};
	if (dayOfWeek === 0 && !isGreatVespers) replacements = {"SUNDAY": data.dismissalsWeekdays[0], "WEEKDAY": "", "THURSDAY": "", "CHURCH": data.dismissalChurch};
	else if (dayOfWeek === 0 && isGreatVespers) replacements = {"SUNDAY": data.dismissalsWeekdays[0], "WEEKDAY": "", "THURSDAY": "", "CHURCH": ""};
	else if (isGreatVespers) replacements = {"SUNDAY": "", "WEEKDAY": "", "THURSDAY": "", "CHURCH": ""};
	else if (dayOfWeek === 4) replacements = {"SUNDAY": "", "WEEKDAY": "", "THURSDAY": data.dismissalsWeekdays[4], "CHURCH": data.dismissalChurch};
	else if (dayOfWeek === 6) replacements = {
	    "SUNDAY": "",
	    "WEEKDAY": data.dismissalsWeekdays[6],
	    "THURSDAY": data.dismissalsWeekdays[4] + data.dismissalsWeekdays[7],
	    "CHURCH": data.dismissalChurch
	    };
	else replacements = {"SUNDAY": "", "WEEKDAY": data.dismissalsWeekdays[dayOfWeek], "THURSDAY": "", "CHURCH": data.dismissalChurch};

	if (!isGreatVespers) {
	    replacements["SAINT"] = `${data.dismissalSaints} ${saintNames.join(", ")}`
	} else {
	    replacements["SAINT"] = `${data.dismissalSaints} ${saintNames.join(", ")}${data.dismissalSaintsSolemn}`
	}

	return `${replaceCapsWords(text, replacements)}<br><br><FONT COLOR="RED">Choir:</FONT> ${amen}`
}


function dismissalMinor(withPriest) {
	if (withPriest == "1") {
		return `<FONT COLOR="RED">Priest:</FONT> ${cross} <b>${data.priestDismissalMinor}</b> `;
	} else {
		return `<FONT COLOR="RED">Chariman:</FONT> ${data.layDismissalMinor}`;
	};
}

export function endingBlockMinor(withPriest){
    return `${gloryAndNow}
	        ${LHM} <FONT COLOR="RED">(3)</FONT>
	        ${giveTheBlessing(withPriest)}<br>
	        ${dismissalMinor(withPriest)}<br>
	        <FONT COLOR="RED">Choir:</FONT> ${data.amen}<br>
	        `
}

export const prayerOfTheHours = `${data.prayerOfTheHours}`
export const amen = `${data.amen}`
export const itIsTrulyRight = `${data.itIsTruly} ${data.moreHonorable}`

export async function lesserDoxology(hour){
    const dox = await getData(`Text\\English\\horologion\\lesser_doxology.json`)
    const replacementDict = {"DAYPART": dox[hour]}
    const head = `<div class="subhead">Lesser Doxology</div>`
    if (hour === "vespers"){
        // vespers uses only the 2nd part
        return `${head}${replaceCapsWords(dox["2"], replacementDict)}`
    }
    document.getElementById("lesserDoxology").innerHTML = `${head}${replaceCapsWords(dox["1"], replacementDict)}<br>${replaceCapsWords(dox["2"], replacementDict)}`
}

export async function getCommonText(textType, dayData){
    if (Array.isArray(dayData["type"])) {
        var texts = [];
        for (let [i, name] of dayData["name"].entries()){
                texts.push(getCommonText(textType, {"name":name, "type": dayData["type"][i]}))
            }
        return (await Promise.all(texts)).flat();
    } else {
        return [replaceCapsWords((await getData(`${address}\\menaion\\common\\${dayData["type"]}.json`))[textType], {"NAME": dayData["name"]})];
    }
}