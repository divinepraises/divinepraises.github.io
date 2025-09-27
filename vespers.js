import { usualBeginning, comeLetUs , lesserDoxology, itIsTrulyRight, trisagionToPater, glory, andNow, LHM, prayerOfTheHours, gloryAndNow, moreHonorable, inTheName,prayerBlessingMayGodBeGracious, amen, endingBlockMinor } from './text_generation.js';
import { parseDate, getData, } from './script.js';

export function vespers(priest, full, date){
	var season, seasonToShow, glas;
    var chosenDate = new Date(date);
	[season, seasonToShow, glas] = parseDate(chosenDate);
	var dayOfWeek = (chosenDate.getDay() + 1)%7 + 1;

    if (dayOfWeek === 7){
        return greatVespers();
    }

    return dailyVespers();
}

function dailyVespers(){
  return `daily vespers - under construction`
}

function greatVespers(){
  return `great vespers - under construction`
}