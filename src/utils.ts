import * as numeral from "numeral";

/**
 *
 * Credit: better-word-count by Luke Leppan (https://github.com/lukeleppan/better-word-count)
 * @param text
 */
export function getWordCount(text: string) {
	let words: number = 0;

	const matches = text.match(
		/[a-zA-Z0-9_\u0392-\u03c9\u00c0-\u00ff\u0600-\u06ff]+|[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\uac00-\ud7af]+/gm
	);

	if (matches) {
		for (let i = 0; i < matches.length; i++) {
			if (matches[i].charCodeAt(0) > 19968) {
				words += matches[i].length;
			} else {
				words += 1;
			}
		}
	}

	return words;
}

export function secondsToHumanize(seconds : number) {
	const minutes = Math.ceil(seconds / 60)
	const secondsForFormatting = Math.round(Math.ceil(seconds) % 60)

	let text : string = ''

	if (seconds >= 60) {
		text += `${numeral(minutes).format('0')} minute${minutes > 1 ? 's' : ''}`
	}
	if (seconds % 60 > 0) {
		if (seconds > 60) {
			text += ' '
		}
		text += `${numeral(secondsForFormatting).format('0')} second${secondsForFormatting > 1 ? 's' : ''}`
	}
	return text
}

export function secondsToMMSS(seconds : number) {
	const minutes = Math.ceil(seconds / 60)
	const secondsForFormatting = Math.round(Math.ceil(seconds) % 60)
	return `${numeral(minutes).format('00')}:${numeral(secondsForFormatting).format('00')}`
}
