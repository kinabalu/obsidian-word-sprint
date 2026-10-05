import {App, Modal, Setting, moment} from "obsidian";
import {secondsToHumanize} from "./utils";
import numeral from 'numeral'
import {SprintRunStat} from "./types";

export default class EndOfSprintStatsModal extends Modal {
	sprintRunStat : SprintRunStat
	sprintHistory : SprintRunStat[]
	statIndex : number;

	constructor(app: App, sprintRunStat : SprintRunStat);
	constructor(app: App, sprintHistory : SprintRunStat[], statIndex : number);
	constructor(app: App, statOrHistory: SprintRunStat | SprintRunStat[], statIndex?: number) {
		super(app);

		if (Array.isArray(statOrHistory)) {
			this.sprintHistory = statOrHistory
			this.statIndex = statIndex ?? statOrHistory.length - 1
			this.sprintRunStat = this.sprintHistory[this.statIndex]
			return
		}

		this.sprintRunStat = statOrHistory
	}

	renderStats(contentEl : HTMLElement) {
		let header = this.sprintHistory ? `Word sprint stats (${this.statIndex + 1} of ${this.sprintHistory.length})` : 'Word sprint stats'
		contentEl.createEl('h2', {text: header})

		let sprintLengthText : string = ''
		if ((this.sprintRunStat.sprintLength * 60) > this.sprintRunStat.elapsedSprintLength) {
			sprintLengthText = `${secondsToHumanize(this.sprintRunStat.elapsedSprintLength)} of ${secondsToHumanize(this.sprintRunStat.sprintLength * 60)}\n`
		} else {
			sprintLengthText = `${secondsToHumanize(this.sprintRunStat.sprintLength * 60)}\n`
		}

		if (this.sprintHistory && this.sprintHistory.length > 1) {
			new Setting(contentEl)
				.setName("Sprint date")
				.addText((text) => {
					text.setValue(moment(this.sprintRunStat.created).format('YYYY-MM-DD HH:mm:ss'))
					text.setDisabled(true)
				})
		}
		new Setting(contentEl)
			.setName("Sprint length")
			.addText((text) => {
				text.setValue(sprintLengthText)
				text.setDisabled(true)
			})
		new Setting(contentEl)
			.setName("Total words written")
			.addText((text) => {
				text.setValue(`${this.sprintRunStat.totalWordsWritten}`)
				text.setDisabled(true)
			})
		new Setting(contentEl)
			.setName("Average words per minute")
			.addText((text) => {
				text.setValue(`${numeral(this.sprintRunStat.averageWordsPerMinute).format('0.0')}`)
				text.setDisabled(true)
			})
		new Setting(contentEl)
			.setName("Yellow notices")
			.addText((text) => {
				text.setValue(`${this.sprintRunStat.yellowNotices}`)
				text.setDisabled(true)
			})
		new Setting(contentEl)
			.setName("Red notices")
			.addText((text) => {
				text.setValue(`${this.sprintRunStat.redNotices}`)
				text.setDisabled(true)
			})
		new Setting(contentEl)
			.setName("Longest stretch not writing")
			.addText((text) => {
				text.setValue(`${secondsToHumanize(this.sprintRunStat.longestStretchNotWriting)}`)
				text.setDisabled(true)
			})
		new Setting(contentEl)
			.setName("Total time not writing")
			.addText((text) => {
				text.setValue(`${secondsToHumanize(this.sprintRunStat.totalTimeNotWriting)}`)
				text.setDisabled(true)
			})

		if (this.sprintHistory && this.sprintHistory.length > 1) {
			new Setting(contentEl)
				.addButton(button => button
					.setButtonText("Previous")
					.setDisabled(this.statIndex === 0)
					.onClick(async () => {
						this.statIndex -= 1
						this.sprintRunStat = this.sprintHistory[this.statIndex]

						contentEl.empty()
						this.renderStats(contentEl)
					})
				)
				.addButton(button => button
					.setButtonText("Next")
					.setDisabled(this.statIndex >= this.sprintHistory.length - 1)
					.onClick(async () => {
						this.statIndex += 1
						this.sprintRunStat = this.sprintHistory[this.statIndex]

						contentEl.empty()
						this.renderStats(contentEl)
					})
				)
		}
	}

	onOpen() {
		let {contentEl} = this;
		contentEl.empty()

		this.renderStats(contentEl)
	}

	onClose() {
		this.sprintRunStat = null

		let {contentEl} = this;
		contentEl.empty();
	}
}
