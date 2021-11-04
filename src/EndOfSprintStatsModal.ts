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
	constructor(...params: any[]) {
		super(params[0]);

		if (params.length === 2) {
			this.sprintRunStat = params[1]
			return
		}

		if (params.length === 3) {
			this.sprintHistory = params[1]
			this.statIndex = params[2]

			this.sprintRunStat = this.sprintHistory[this.statIndex]
			return
		}
	}

	renderStats(contentEl : HTMLElement) {
		let header = this.sprintHistory ? `Word Sprint Stats (${this.statIndex + 1} of ${this.sprintHistory.length})` : 'Word Sprint Stats'
		contentEl.createEl('h2', {text: header})

		let sprintLengthText : string = ''
		if ((this.sprintRunStat.sprintLength * 60) > this.sprintRunStat.elapsedSprintLength) {
			sprintLengthText = `${secondsToHumanize(this.sprintRunStat.elapsedSprintLength)} of ${secondsToHumanize(this.sprintRunStat.sprintLength * 60)}\n`
		} else {
			sprintLengthText = `${secondsToHumanize(this.sprintRunStat.sprintLength * 60)}\n`
		}

		new Setting(contentEl)
			.setName("Sprint Date")
			.addText((text) => {
				text.setValue(moment(this.sprintRunStat.created).format('YYYY-MM-DD HH:mm:ss'))
				text.setDisabled(true)
			})

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
		new Setting(contentEl)
			.setName("Average Words Per Minute")
			.addText((text) => {
				text.setValue(`${numeral(this.sprintRunStat.averageWordsPerMinute).format('0.0')}`)
				text.setDisabled(true)
			})
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
		new Setting(contentEl)
			.setName("Total Time Not Writing")
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
