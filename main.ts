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
import { WordsPerMinute, WordSprintSettings } from './src/settings'
import { getWordCount, secondsToMMSS } from './src/utils'

const DEFAULT_SETTINGS: WordSprintSettings = {
	sprintLength: 25,
	yellowNoticeText: "Keep on writing, this is a sprint!",
	redNoticeText: "Enjoy that break, get back to writing when you're back",
}

export default class WordSprintPlugin extends Plugin {
	settings: WordSprintSettings
	sprintInterval : number
	statusBarItemEl : HTMLElement
	sprintStarted : boolean = false
	debouncedUpdate: Debouncer<[contents: string, filepath: string]>

	lastWordTime : number = 0
	previousWordCount : number
	wordCount : number = 0
	wordsPerMinute : WordsPerMinute[] = [{
		previous: 0,
		now: 0,
	}];

	latestMinute : number = 0

	yellowNoticeCount : number = 0
	redNoticeCount : number = 0
	longestWritingStretch : number = 0
	longestStretchNotWriting : number = 0
	totalTimeNotWriting : number = 0

	yellowNoticeShown : boolean = false
	redNoticeShown : boolean = false

	getWordCountDisplay() : number {
		let wordCountDisplay : number = this.wordCount - this.previousWordCount
		return wordCountDisplay >= 0 ? wordCountDisplay : 0
	}

	async onload() {
		await this.loadSettings();

		this.registerEvent(
			this.app.workspace.on('quick-preview', this.onQuickPreview.bind(this))
		)
		this.debouncedUpdate = debounce((contents: string, filepath: string) => {
			const secondsSinceLastWord = Date.now() - this.lastWordTime

			console.log(`Date.now(): ${Date.now() / 1000} - secondsSinceLastWord: ${secondsSinceLastWord / 1000} seconds - this.lastWordTime: ${this.lastWordTime} - this.longestStretchNotWriting: ${this.longestStretchNotWriting / 1000} seconds`)
			if (secondsSinceLastWord > this.longestStretchNotWriting) {
				this.longestStretchNotWriting = secondsSinceLastWord
			}
			this.totalTimeNotWriting += secondsSinceLastWord

			this.lastWordTime = Date.now()
			this.wordCount = getWordCount(contents)

			this.wordsPerMinute[this.latestMinute].now = (this.getWordCountDisplay() - this.wordsPerMinute[this.latestMinute].previous)
		}, 400, false)

		this.addCommand({
			id: 'insert-last-word-sprint-stats',
			name: 'Insert Last Word Sprint Stats',
			editorCallback: async (editor: Editor) => {
				let statsText : string;

				if (this.sprintStarted) {
					new Notice("Sprint still going, but here's the stats as of this moment")
				}

				const averageWordsPerMinute = this.wordsPerMinute.reduce((total: number, amount: WordsPerMinute, index: number, array: WordsPerMinute[]) => {
					total += amount.now
					return total / array.length
				}, 0)
				statsText = `Total Words Written: ${this.getWordCountDisplay()}\n`
				statsText += `Average Words Per Minute: ${numeral(averageWordsPerMinute).format('0')}\n`
				statsText += `Yellow Notices: ${this.yellowNoticeCount}\n`
				statsText += `Red Notices: ${this.redNoticeCount}\n`
				statsText += `Longest Stretch Not Writing: ${Math.ceil(this.longestStretchNotWriting / 1000)} seconds\n`
				statsText += `Total Time Not Writing: ${Math.ceil(this.totalTimeNotWriting / 1000)} seconds\n`

				editor.replaceSelection(statsText)
			}
		})
		this.addCommand({
			id: 'start-word-sprint',
			name: 'Start Word Sprint',
			callback: () => {
				if (this.sprintStarted) {
					new Notice("Sprint already started! Please stop current sprint if you'd like to reset")
					return
				}
				let msTotal = this.settings.sprintLength * 60 * 1000
				this.statusBarItemEl = this.addStatusBarItem()
				let status = 'GREEN'
				const now = Date.now()
				this.lastWordTime = Date.now()
				this.statusBarItemEl.setText(`Word Sprint - ${secondsToMMSS(msTotal / 1000)} left - ${this.getWordCountDisplay()} words written`)
				this.sprintStarted = true

				// reset all the stats
				this.yellowNoticeCount = 0
				this.redNoticeCount = 0
				this.longestWritingStretch = 0
				this.longestStretchNotWriting = 0
				this.totalTimeNotWriting = 0
				this.wordsPerMinute = [{
					previous: 0,
					now: 0
				}]
				this.yellowNoticeShown = false
				this.redNoticeShown	= false

				if (this.app.workspace.getActiveViewOfType(MarkdownView)) {
					let viewData = this.app.workspace.getActiveViewOfType(MarkdownView).getViewData()
					this.previousWordCount = getWordCount(viewData)
				}

				this.sprintInterval = window.setInterval(() => {
					const currentNow = Date.now()
					const elapsedMs = currentNow - now

					const msLeft = msTotal - elapsedMs

					const msSinceLastWord = Date.now() - this.lastWordTime

					if (Math.floor(elapsedMs / 1000 / 60) > this.latestMinute) {
						this.latestMinute = Math.floor(elapsedMs / 1000 / 60)

						this.wordsPerMinute.push({
							previous: this.getWordCountDisplay(),
							now: 0,
						})
					}
					if (msSinceLastWord >= 10 * 1000 && !this.yellowNoticeShown) {
						new Notice(this.settings.yellowNoticeText)
						this.yellowNoticeShown = true
						status = 'YELLOW'
						this.yellowNoticeCount += 1
					} else if (msSinceLastWord >= 60 * 1000 && !this.redNoticeShown) {
						new Notice(this.settings.redNoticeText)
						this.redNoticeShown = true
						status = 'RED'
						this.redNoticeCount += 1
					} else if(msSinceLastWord < 10 * 1000) {
						this.yellowNoticeShown = false
						this.redNoticeShown = false
						status = 'GREEN'
					}

					this.statusBarItemEl.setText(`Word Sprint - ${secondsToMMSS(msLeft / 1000)} left - ${this.getWordCountDisplay()} words written - ${status}`)

					if (msLeft <= 0 && this.sprintStarted) {
						window.clearInterval(this.sprintInterval)
						this.statusBarItemEl.setText('')
						this.sprintStarted = false
						new Notice(`Word Sprint Complete! Congratulations! Total words written: ${this.getWordCountDisplay()}`)
						new EndOfSprintStatsModal(this.app, this).open()
					}
				}, 1000)
				this.registerInterval(this.sprintInterval);
			}
		})

		this.addCommand({
			id: 'stop-word-sprint',
			name: 'Stop Word Sprint',
			callback: () => {
				if (this.sprintInterval) {
					this.statusBarItemEl.setText('')
					this.sprintStarted = false
					new EndOfSprintStatsModal(this.app, this).open()
					new Notice(`Word Sprint Cancelled! Total words written: ${this.getWordCountDisplay()}`)
					window.clearInterval(this.sprintInterval)
				} else {
					new Notice('No Word Sprint running')
				}
			}
		})
		this.addSettingTab(new WordSprintSettingsTab(this.app, this));
	}

	onQuickPreview(file: TFile, contents: string) {
		if (this.app.workspace.getActiveViewOfType(MarkdownView)) {
			if (this.sprintStarted) {
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
