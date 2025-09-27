import { getData, replaceCapsWords } from './script.js';

const response = await fetch('./Text/English/horologion/general_texts.json');
const data = await response.json();

const cross = `<FONT COLOR="RED"><b>†</b></FONT>`

export const glory = `${cross} ${data.glory}.`

export const andNow = `${data.andNow}`

export const gloryAndNow = `${glory} ${andNow}`

export const LHM = `${data.lhm}`

export const moreHonorable = `${data.moreHonorable}`

export const inTheName = `${data.inTheName}`

export function trisagionToPater(priest){
    return `${cross} ${data.trisagion} <FONT COLOR="RED">(3)</FONT><br>
		${gloryAndNow}
		${data.trinity}<br>
		${data.lhm} <FONT COLOR="RED">(3)</FONT><br>
		${glory}<br>
		${andNow}<br>
		${data.ourFather}<br>
		${getOurFatherEnding(priest)}<br>
		<FONT COLOR="RED">Choir:</FONT> ${data.amen} `;
}

export const tripleAlleluia = `${glory}<br>
    ${andNow}<br>
	${cross} ${data.tripleAlleluia} <FONT COLOR="RED">(3)</FONT><br>
	${data.lhm} <FONT COLOR="RED">(3)</FONT> `;

export function usualBeginning(priest, season){
 var HK;
 if (season === "Pentecost" || season === "ËasterWeek"){
  HK = "";
 } else {
  HK = `${data.heavenlyKing}<br>`;
 }
 return `${getBeginning(priest)}<br>
		<FONT COLOR="RED">Choir:</FONT> ${data.amen}<br>
		${data.gloryBeToYou}<br>
		${HK}
		${trisagionToPater(priest)}
		${data.lhm} <FONT COLOR="RED">(12)</FONT><br>
		${gloryAndNow}`;
}
export const comeLetUs = `${cross} ${data.clw1}<br>
		${cross} ${data.clw2}<br>
		${cross} ${data.clw3} `

function getBeginning(withPriest) {
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
		return `<FONT COLOR="RED">Chariman:</FONT> ${data.JesusPrayer} `;
	};
}

export function prayerBlessingMayGodBeGracious(withPriest) {
	if (withPriest == "1") {
		return `<FONT COLOR="RED">Priest:</FONT> ${cross} <b>${data.mayGodBeGracious}</b> `;
	} else {
		return `<FONT COLOR="RED">Chariman:</FONT> ${data.zamolytv} `;
	};
}

function giveTheBlessing(withPriest) {
	if (withPriest == "1") {
		return `${data.giveTheBlessing}`;
	} else {
		return `${data.LordBless}`;
	};
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