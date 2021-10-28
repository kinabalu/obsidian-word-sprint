import {App, Modal, Setting} from "obsidian";
import numeral from "numeral";
import WordSprintPlugin from "../main";

export default class EndOfSprintStatsModal extends Modal {
	plugin : WordSprintPlugin;

	constructor(app: App, plugin: WordSprintPlugin) {
		super(app);
		this.plugin = plugin
	}

	onOpen() {
		let {contentEl} = this;

		contentEl.createEl('h2', {text: 'Word Sprint Stats'})

		const averageWordsPerMinute = this.plugin.wordsPerMinute.reduce((total: number, amount: WordsPerMinute, index: number, array: WordsPerMinute[]) => {
			total += amount.now
			return total / array.length
		}, 0)

		new Setting(contentEl)
			.setName("Total Words Written")
			.addText((text) => {
				text.setValue(`${this.plugin.getWordCountDisplay()}`)
				text.setDisabled(true)
			})
		new Setting(contentEl)
			.setName("Average Words Per Minute")
			.addText((text) => {
				text.setValue(`${numeral(averageWordsPerMinute).format('0')}`)
				text.setDisabled(true)
			})
		new Setting(contentEl)
			.setName("Yellow Notices")
			.addText((text) => {
				text.setValue(`${this.plugin.yellowNoticeCount}`)
				text.setDisabled(true)
			})
		new Setting(contentEl)
			.setName("Red Notices")
			.addText((text) => {
				text.setValue(`${this.plugin.redNoticeCount}`)
				text.setDisabled(true)
			})
		new Setting(contentEl)
			.setName("Longest Stretch Not Writing")
			.addText((text) => {
				text.setValue(`${Math.ceil(this.plugin.longestStretchNotWriting / 1000)} seconds`)
				text.setDisabled(true)
			})
		new Setting(contentEl)
			.setName("Total Time Not Writing")
			.addText((text) => {
				text.setValue(`${Math.ceil(this.plugin.totalTimeNotWriting / 1000)} seconds`)
				text.setDisabled(true)
			})
	}

	onClose() {
		let {contentEl} = this;
		contentEl.empty();
	}
}
