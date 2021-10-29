import {
	Notice,
	Plugin,
	debounce,
	TFile,
	MarkdownView,
	Debouncer,
	Editor,
} from 'obsidian';

import numeral from 'numeral'

import EndOfSprintStatsModal from './src/EndOfSprintStatsModal'
import WordSprintSettingsTab from './src/WordSprintSettingsTab'
import { WordSprintSettings } from './src/settings'
import {getWordCount, secondsToHumanize} from './src/utils'
import SprintRun, {SprintRunStat} from "./src/SprintRun";
import StatView, {STAT_VIEW_TYPE} from "./src/StatView";

const DEFAULT_SETTINGS: WordSprintSettings = {
	sprintLength: 25,
	showLagNotices: true,
	yellowNoticeText: "Keep on writing, this is a sprint!",
	redNoticeText: "Enjoy that break, get back to writing when you're back",
}

export default class WordSprintPlugin extends Plugin {
	settings: WordSprintSettings
	statusBarItemEl : HTMLElement
	debouncedUpdate: Debouncer<[contents: string, filepath: string]>

	sprintInterval : number
	theSprint : SprintRun

	async onload() {
		await this.loadSettings();

		// TODO add ability to update sprint length based on settings
		this.theSprint = new SprintRun(this.settings.sprintLength)

		this.registerView(
			STAT_VIEW_TYPE,
			(leaf) => new StatView(this.theSprint, this, leaf),
		)

		this.addRibbonIcon("pencil", "Activate Word Sprint Leaf", () => {
			this.activateView()
		})
		this.registerEvent(
			this.app.workspace.on('quick-preview', this.onQuickPreview.bind(this))
		)

		this.addCommand({
			id: 'insert-last-word-sprint-stats',
			name: 'Insert Last Word Sprint Stats',
			editorCallback: async (editor: Editor) => {
				let statsText : string;

				if (this.theSprint && this.theSprint.isStarted()) {
					new Notice("Sprint still going, but here's the stats as of this moment")
				}

				const stats = this.theSprint.getStats()

				statsText = `Sprint Length: ${secondsToHumanize(stats.sprintLength * 60)}\n`
				statsText += `Total Words Written: ${stats.totalWordsWritten}\n`
				statsText += `Average Words Per Minute: ${numeral(stats.averageWordsPerMinute).format('0')}\n`
				statsText += `Yellow Notices: ${stats.yellowNotices}\n`
				statsText += `Red Notices: ${stats.redNotices}\n`
				statsText += `Longest Stretch Not Writing: ${secondsToHumanize(stats.longestStretchNotWriting)}\n`
				statsText += `Total Time Not Writing: ${secondsToHumanize(stats.totalTimeNotWriting)}\n`

				editor.replaceSelection(statsText)
			}
		})
		this.addCommand({
			id: 'start-word-sprint',
			name: 'Start Word Sprint',
			callback: () => {
				this.startSprintCommand()

				//
				// if (this.theSprint && this.theSprint.isStarted()) {
				// 	new Notice("Sprint already started! Please stop current sprint if you'd like to reset")
				// 	return
				// }
				//
				// let previousWordCount = 0
				// if (this.app.workspace.getActiveViewOfType(MarkdownView)) {
				// 	let viewData = this.app.workspace.getActiveViewOfType(MarkdownView).getViewData()
				// 	previousWordCount = getWordCount(viewData)
				// }
				// this.statusBarItemEl = this.addStatusBarItem()
				// this.debouncedUpdate = debounce((contents: string, filepath: string) => {
				// 	this.theSprint.typingUpdate(contents, filepath)
				// }, 400, false)
				//
				// const sprintInterval = this.theSprint.startSprint(previousWordCount, (status: string, statusChanged : boolean) => {
				// 	const miniStats = this.theSprint.getMiniStats()
				//
				// 	if (statusChanged) {
				// 		switch(status) {
				// 			case 'YELLOW':
				// 				this.settings.showLagNotices && new Notice(this.settings.yellowNoticeText)
				// 				break
				// 			case 'RED':
				// 				this.settings.showLagNotices && new Notice(this.settings.redNoticeText)
				// 				break
				// 			default:
				// 		}
				// 	}
				// 	this.statusBarItemEl.setText(`Word Sprint - ${miniStats.secondsLeft} left - ${miniStats.wordCount} words written`)
				// },(sprintRunStat : SprintRunStat) => {
				// 	window.clearInterval(this.sprintInterval)
				// 	this.statusBarItemEl.setText('')
				// 	new Notice(`Word Sprint Complete! Congratulations! Total words written: ${sprintRunStat.totalWordsWritten}`)
				// 	new EndOfSprintStatsModal(this.app, sprintRunStat).open()
				// })
				//
				// this.registerInterval(sprintInterval);
			}
		})

		this.addCommand({
			id: 'stop-word-sprint',
			name: 'Stop Word Sprint',
			callback: () => {
				if (this.theSprint && this.theSprint.isStarted()) {
					this.statusBarItemEl.setText('')
					const sprintRunStat : SprintRunStat = this.theSprint.stopSprint()

					this.showEndOfSprintStatsModal()
					new Notice(`Word Sprint Cancelled! Total words written: ${sprintRunStat.totalWordsWritten}`)
				} else {
					new Notice('No Word Sprint running')
				}
			}
		})
		this.addSettingTab(new WordSprintSettingsTab(this.app, this));
	}


	startSprintCommand() {
		if (this.theSprint && this.theSprint.isStarted()) {
			new Notice("Sprint already started! Please stop current sprint if you'd like to reset")
			return
		}

		let previousWordCount = 0
		if (this.app.workspace.getActiveViewOfType(MarkdownView)) {
			let viewData = this.app.workspace.getActiveViewOfType(MarkdownView).getViewData()
			previousWordCount = getWordCount(viewData)
		}
		this.statusBarItemEl = this.addStatusBarItem()
		this.debouncedUpdate = debounce((contents: string, filepath: string) => {
			this.theSprint.typingUpdate(contents, filepath)
		}, 400, false)

		const sprintInterval = this.theSprint.startSprint(previousWordCount, (status: string, statusChanged : boolean) => {
			const miniStats = this.theSprint.getMiniStats()

			if (statusChanged) {
				switch(status) {
					case 'YELLOW':
						this.settings.showLagNotices && new Notice(this.settings.yellowNoticeText)
						break
					case 'RED':
						this.settings.showLagNotices && new Notice(this.settings.redNoticeText)
						break
					default:
				}
			}
			this.statusBarItemEl.setText(`Word Sprint - ${miniStats.secondsLeft} left - ${miniStats.wordCount} words written`)
		},(sprintRunStat : SprintRunStat) => {
			window.clearInterval(this.sprintInterval)
			this.statusBarItemEl.setText('')
			new Notice(`Word Sprint Complete! Congratulations! Total words written: ${sprintRunStat.totalWordsWritten}`)
			new EndOfSprintStatsModal(this.app, sprintRunStat).open()
		})

		this.registerInterval(sprintInterval);
	}

	showEndOfSprintStatsModal() {
		new EndOfSprintStatsModal(this.app, this.theSprint.getStats()).open()
	}

	async onunload() {
		this.app.workspace.detachLeavesOfType(STAT_VIEW_TYPE)
	}

	async activateView() {
		this.app.workspace.detachLeavesOfType(STAT_VIEW_TYPE)

		await this.app.workspace.getRightLeaf(false).setViewState({
			type: STAT_VIEW_TYPE,
			active: true,
		})

		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(STAT_VIEW_TYPE)[0]
		)
	}

	onQuickPreview(file: TFile, contents: string) {
		if (this.app.workspace.getActiveViewOfType(MarkdownView)) {
			if (this.theSprint && this.theSprint.isStarted()) {
				this.debouncedUpdate(contents, file.path)
			}
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
