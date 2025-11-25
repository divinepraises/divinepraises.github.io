import { getData, replaceCapsWords } from './script.js';
const address = `Text\\English`

const response = await fetch('./Text/English/horologion/general_texts.json');
const data = await response.json();

export const postfeast = data.postfeast;
export const forefeast = data.forefeast;

export const cross = `<FONT COLOR="RED"><b>†</b></FONT>`

export const glory = `${cross} ${data.glory}.`

export const andNow = data.andNow;

export const gloryAndNow = `${glory} ${andNow}`

export const LHM = data.lhm;
export const GTL = data.gtl;
export const TYL = data.tyl;

export const st = data.saint;

export function StEphremPrayer(short=false){
    var res = `<div class=subhead>Prayer of st. Ephrem of Syria</div><br>`;
    const stEphrem = data.st_ephrem
    for (let verse of stEphrem.slice(0, 3)){
        res += `${cross} ${verse} <div class="rubric">Prostration.</div>`
    }
    if (short) return res;
    res += `<br> <div class="rubric">Then twelve inclinations, repeating these three verses for four times:</div>`;
    for (let verse of stEphrem.slice(3, stEphrem.length)){
        res += `${cross} ${verse} <br>`
    }
    res += `<br> ${cross} ${stEphrem.slice(0, 3).join(" ")} <div class="rubric">Prostration.</div>`
    return res;
}

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

export function prayerBlessingMayGodBeGracious(withPriest, hour="") {
	if (withPriest === "0") {
		return `<FONT COLOR="RED">Chariman:</FONT> ${data.zamolytv} `;
	} else if (hour != "3hour" && hour != "6hour") {
		return `<FONT COLOR="RED">Priest:</FONT> ${cross} <b>${data.mayGodBeGracious}</b> `;
	} else {
		return `<FONT COLOR="RED">Priest:</FONT> ${cross} <b>${data.zamolytv}</b> `;
	};
}

export function giveTheBlessing(withPriest) {
	if (withPriest == "1") {
		return `${data.giveTheBlessing}`;
	} else {
		return `${data.LordBless}`;
	};
}

export function dismissalMajor(dayOfWeek, withPriest, isGreatVespers, prePostFeast, saintNames, TheotokosDismissal) {
    var text;
    var replacements = {};
	if (withPriest == "1") {
		text = `<FONT COLOR="RED">Priest:</FONT> ${cross} <b>${data.priestDismissalMajor}</b> `;
	} else {
		text = `<FONT COLOR="RED">Chariman:</FONT> ${data.layDismissalMajor}`;
	};
	if (TheotokosDismissal != "") TheotokosDismissal = replaceCapsWords(data.dismissalTheotokos, {"SAINT":TheotokosDismissal});
	else TheotokosDismissal = ";";

	if (dayOfWeek === 0 && !isGreatVespers) replacements = {"SUNDAY": data.dismissalsWeekdays[0], "WEEKDAY": "", "THURSDAY": "", "CHURCH": data.dismissalChurch, "THEOTOKOS": TheotokosDismissal};
	else if (dayOfWeek === 0 && isGreatVespers) replacements = {"SUNDAY": data.dismissalsWeekdays[0], "WEEKDAY": "", "THURSDAY": "", "CHURCH": "", "THEOTOKOS": TheotokosDismissal};
	else if (isGreatVespers || prePostFeast === "postfeast") replacements = {"SUNDAY": "", "WEEKDAY": "", "THURSDAY": "", "CHURCH": "", "THEOTOKOS": TheotokosDismissal};
	else if (dayOfWeek === 4) replacements = {"SUNDAY": "", "WEEKDAY": "", "THURSDAY": data.dismissalsWeekdays[4], "CHURCH": data.dismissalChurch, "THEOTOKOS": TheotokosDismissal};
	else if (dayOfWeek === 6) replacements = {
	    "SUNDAY": "",
	    "WEEKDAY": data.dismissalsWeekdays[6],
	    "THURSDAY": data.dismissalsWeekdays[4] + data.dismissalsWeekdays[7],
	    "CHURCH": data.dismissalChurch,
	    "THEOTOKOS": TheotokosDismissal
	    };
	else replacements = {"SUNDAY": "", "WEEKDAY": data.dismissalsWeekdays[dayOfWeek], "THURSDAY": "", "CHURCH": data.dismissalChurch, "THEOTOKOS": TheotokosDismissal};

	if (!isGreatVespers) {
	    replacements["SAINT"] = `${data.dismissalSaints} ${saintNames.join(", ")}`
	} else if (TheotokosDismissal===";"){
	    replacements["SAINT"] = `${data.dismissalSaints} ${saintNames.join(", ")}${data.dismissalSaintsSolemn}`
	} else {
	    replacements["SAINT"] = "";
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
	        ${LHM} <FONT COLOR="RED">(3)</FONT> ${giveTheBlessing(withPriest)}<br><br>
	        ${dismissalMinor(withPriest)}<br><br>
	        <FONT COLOR="RED">Choir:</FONT> ${data.amen}<br>
	        `
}

export const prayerOfTheHours = `${data.prayerOfTheHours}`
export const amen = `${data.amen}`
export const itIsTrulyRight = `${data.itIsTruly} ${data.moreHonorable}`

export async function lesserDoxology(hour){
    const dox = await getData(`Text\\English\\horologion\\lesser_doxology.json`)
    const replacementDict = {"DAYPART": dox[hour]}
    const head = `<div class="subhead">Lesser Doxology</div><br>`
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
                if (dayData["type"][i] === "") continue
                texts.push(getCommonText(textType, {"name":name, "type": dayData["type"][i]}))
            }
        return (await Promise.all(texts)).flat();
    } else {
        return [replaceCapsWords((await getData(`${address}\\menaion\\common\\${dayData["type"]}.json`))[textType], {"NAME": dayData["name"]})];
    }
}