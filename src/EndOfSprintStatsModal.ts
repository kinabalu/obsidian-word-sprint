import {App, Modal, Setting} from "obsidian";
import {SprintRunStat} from "./SprintRun";
import {secondsToHumanize} from "./utils";

export default class EndOfSprintStatsModal extends Modal {
	sprintRunStat : SprintRunStat

	constructor(app: App, sprintRunStat : SprintRunStat) {
		super(app);
		this.sprintRunStat = sprintRunStat
	}

	onOpen() {
		let {contentEl} = this;

		contentEl.createEl('h2', {text: 'Word Sprint Stats'})

		console.dir(this.sprintRunStat)
		let sprintLengthText : string = ''
		if ((this.sprintRunStat.sprintLength * 60) > this.sprintRunStat.elapsedSprintLength) {
			sprintLengthText = `${secondsToHumanize(this.sprintRunStat.elapsedSprintLength)} of ${secondsToHumanize(this.sprintRunStat.sprintLength * 60)}\n`
		} else {
			sprintLengthText = `${secondsToHumanize(this.sprintRunStat.sprintLength * 60)}\n`
		}

		new Setting(contentEl)
			.setName("Sprint Length")
			.addText((text) => {
				text.setValue(sprintLengthText)
				text.setDisabled(true)
			})
		new Setting(contentEl)
			.setName("Total Words Written")
			.addText((text) => {
				text.setValue(`${this.sprintRunStat.totalWordsWritten}`)
				text.setDisabled(true)
			})
		// new Setting(contentEl)
		// 	.setName("Average Words Per Minute")
		// 	.addText((text) => {
		// 		text.setValue(`${numeral(this.sprintRunStat.averageWordsPerMinute).format('0')}`)
		// 		text.setDisabled(true)
		// 	})
		new Setting(contentEl)
			.setName("Yellow Notices")
			.addText((text) => {
				text.setValue(`${this.sprintRunStat.yellowNotices}`)
				text.setDisabled(true)
			})
		new Setting(contentEl)
			.setName("Red Notices")
			.addText((text) => {
				text.setValue(`${this.sprintRunStat.redNotices}`)
				text.setDisabled(true)
			})
		new Setting(contentEl)
			.setName("Longest Stretch Not Writing")
			.addText((text) => {
				text.setValue(`${secondsToHumanize(this.sprintRunStat.longestStretchNotWriting)}`)
				text.setDisabled(true)
			})
		// new Setting(contentEl)
		// 	.setName("Total Time Not Writing")
		// 	.addText((text) => {
		// 		text.setValue(`${secondsToHumanize(this.sprintRunStat.totalTimeNotWriting)}`)
		// 		text.setDisabled(true)
		// 	})
	}

	onClose() {
		this.sprintRunStat = null

		let {contentEl} = this;
		contentEl.empty();
	}
}
