import {
	App,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	debounce,
	TFile,
	MarkdownView,
	Debouncer,
	Editor, EditorPosition
} from 'obsidian';

import numeral from 'numeral'

interface WordSprintSettings {
	sprintLength: number;
	yellowNoticeText : string;
	redNoticeText : string;
}

const DEFAULT_SETTINGS: WordSprintSettings = {
	sprintLength: 25,
	yellowNoticeText: "Keep on writing, this is a sprint!",
	redNoticeText: "Enjoy that break, get back to writing when you're back",
}

export default class WordSprintPlugin extends Plugin {
	settings: WordSprintSettings;
	sprintInterval : number;
	statusBarItemEl : HTMLElement;
	sprintStarted : boolean = false;
	debouncedUpdate: Debouncer<[contents: string, filepath: string]>;

	lastWordTime : number = 0;
	previousWordCount : number;
	wordCount : number = 0;

	yellowNoticeCount : number = 0;
	redNoticeCount : number = 0;
	longestWritingStretch : number = 0;
	longestStretchNotWriting : number = 0;

	yellowNoticeShown : boolean = false
	redNoticeShown : boolean = false

	getWordCountDisplay() : number {
		let wordCountDisplay : number = this.wordCount - this.previousWordCount
		return wordCountDisplay >= 0 ? wordCountDisplay : 0
	}

	secondsToMMSS(seconds : number) {
		const minutes = Math.floor(seconds / 60)
		const secondsForFormatting = Math.ceil(seconds % 60)
		return `${numeral(minutes).format('00')}:${numeral(secondsForFormatting).format('00')}`
	}

	async onload() {
		await this.loadSettings();

		this.registerEvent(
			this.app.workspace.on('quick-preview', this.onQuickPreview.bind(this))
		)
		// this.registerInterval(
		// 	window.setInterval(() => {
		// 	}, 200)
		// )

		this.debouncedUpdate = debounce((contents: string, filepath: string) => {
			this.lastWordTime = Date.now()
			const curr = this.getWordCount(contents)
			this.wordCount = curr
			// updateWordCount(contents: string, filepath: string) {
			// 	const curr = this.getWordCount(contents);
			// 	if (this.settings.dayCounts.hasOwnProperty(this.today)) {
			// 		if (this.settings.todaysWordCount.hasOwnProperty(filepath)) {//updating existing file
			// 			this.settings.todaysWordCount[filepath].current = curr;
			// 		} else {//created new file during session
			// 			this.settings.todaysWordCount[filepath] = { initial: curr, current: curr };
			// 		}
			// 	} else {//new day, flush the cache
			// 		this.settings.todaysWordCount = {};
			// 		this.settings.todaysWordCount[filepath] = { initial: curr, current: curr };
			// 	}
			// 	this.updateCounts();
			// }
		}, 400, false)

		this.addCommand({
			id: 'insert-last-word-sprint-stats',
			name: 'Insert Last Word Sprint Stats',
			editorCallback: async (editor: Editor) => {
				let statsText : string;

				if (this.sprintStarted) {
					new Notice("Sprint still going, but here's the stats as of this moment")
				}

				statsText = `Total Words Written: ${this.getWordCountDisplay()}\n`
				statsText += `Yellow Notices: ${this.yellowNoticeCount}\n`
				statsText += `Red Notices: ${this.redNoticeCount}\n`
				statsText += `Longest Stretch Not Writing: ${Math.ceil(this.longestStretchNotWriting)} seconds`

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
				let secondsTotal = this.settings.sprintLength * 60
				this.statusBarItemEl = this.addStatusBarItem()
				let status = 'GREEN'
				const now = Date.now()
				this.lastWordTime = Date.now()
				this.statusBarItemEl.setText(`Word Sprint - ${this.secondsToMMSS(secondsTotal)} left - ${this.getWordCountDisplay()} words written`)
				this.sprintStarted = true

				// reset all the stats
				this.yellowNoticeCount = 0
				this.redNoticeCount = 0
				this.longestWritingStretch = 0
				this.longestStretchNotWriting = 0
				this.yellowNoticeShown = false
				this.redNoticeShown	= false

				if (this.app.workspace.getActiveViewOfType(MarkdownView)) {
					let viewData = this.app.workspace.getActiveViewOfType(MarkdownView).getViewData()
					this.previousWordCount = this.getWordCount(viewData)
				}

				this.sprintInterval = window.setInterval(() => {
					const currentNow = Date.now()
					const elapsedSeconds = Math.floor((currentNow - now) / 1000)

					const secondsLeft = secondsTotal - elapsedSeconds

					const secondsSinceLastWord = Math.floor(Date.now() - this.lastWordTime) / 1000
					if (secondsSinceLastWord >= 10 && !this.yellowNoticeShown) {
						new Notice(this.settings.yellowNoticeText)
						this.yellowNoticeShown = true
						status = 'YELLOW'
						this.yellowNoticeCount += 1
						this.longestStretchNotWriting += secondsSinceLastWord
					} else if (secondsSinceLastWord >= 60 && !this.redNoticeShown) {
						new Notice(this.settings.redNoticeText)
						this.redNoticeShown = true
						status = 'RED'
						this.redNoticeCount += 1
						this.longestStretchNotWriting += secondsSinceLastWord
					} else if(secondsSinceLastWord < 10) {
						this.yellowNoticeShown = false
						this.redNoticeShown = false
						status = 'GREEN'
					}

					// if (this.app.workspace.getActiveViewOfType(MarkdownView)) {
					// 	let viewData = this.app.workspace.getActiveViewOfType(MarkdownView).getViewData()
					// 	const editor = this.app.workspace.getActiveViewOfType(MarkdownView).editor
					//
					// 	const timerIndex = viewData.indexOf('#sprint')
					//
					// 	if (timerIndex >= 0) {
					// 		let timerPosition : EditorPosition = editor.offsetToPos(timerIndex)
					//
					// 		const timerLine = editor.getLine(timerPosition.line)
					//
					// 		let endOfTimerPosition : EditorPosition = {
					// 			line: timerPosition.line,
					// 			ch: timerPosition.ch + timerLine.length
					// 		} as EditorPosition
					//
					// 		editor.replaceRange(`#sprint: ${this.secondsToMMSS(secondsLeft)} left - ${this.getWordCountDisplay()} words written - ${status}`, timerPosition, endOfTimerPosition)
					// 	}
					// }

					this.statusBarItemEl.setText(`Word Sprint - ${this.secondsToMMSS(secondsLeft)} left - ${this.getWordCountDisplay()} words written - ${status}`)

					if (secondsLeft <= 0 && this.sprintStarted) {
						window.clearInterval(this.sprintInterval)
						this.statusBarItemEl.setText('')
						this.sprintStarted = false
						new Notice(`Word Sprint Complete! Congratulations! Total words written: ${this.getWordCountDisplay()}`)
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

	onunload() {

	}

	//Credit: better-word-count by Luke Leppan (https://github.com/lukeleppan/better-word-count)
	getWordCount(text: string) {
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

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class WordSprintSettingsTab extends PluginSettingTab {
	plugin: WordSprintPlugin;

	constructor(app: App, plugin: WordSprintPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Word Sprint Settings'});

		new Setting(containerEl)
			.setName('Sprint Length')
			.setDesc('(in minutes)')
			.addText(text => text
				.setPlaceholder('25')
				.setValue(`${this.plugin.settings.sprintLength}`)
				.onChange(async (value) => {
					this.plugin.settings.sprintLength = Number(value)
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('First notice when not writing')
			.setDesc('(for 10 seconds)')
			.addText(text => text
				.setValue(`${this.plugin.settings.yellowNoticeText}`)
				.onChange(async (value) => {
					this.plugin.settings.yellowNoticeText = value
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Second notice when not writing')
			.setDesc('(for 60 seconds)')
			.addText(text => text
				.setValue(`${this.plugin.settings.redNoticeText}`)
				.onChange(async (value) => {
					this.plugin.settings.redNoticeText = value
					await this.plugin.saveSettings();
				}));
	}
}
