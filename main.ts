import {App, Notice, Plugin, PluginSettingTab, Setting, debounce, TFile, MarkdownView, Debouncer} from 'obsidian';

import numeral from 'numeral'

interface WordSprintSettings {
	sprintLength: number;
}

const DEFAULT_SETTINGS: WordSprintSettings = {
	sprintLength: 25
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

	yellowNoticeShown : boolean = false
	redNoticeShown : boolean = false

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
			id: 'debug-test',
			name: 'Debug Test',
			callback: () => {
				console.log('hi mom')
			}
		})
		this.addCommand({
			id: 'start-word-sprint',
			name: 'Start Word Sprint',
			callback: () => {
				let secondsTotal = this.settings.sprintLength * 60
				this.statusBarItemEl = this.addStatusBarItem()

				let status = 'GREEN'

				const now = Date.now()
				this.lastWordTime = Date.now()

				this.statusBarItemEl.setText(`Word Sprint - ${this.secondsToMMSS(secondsTotal)} left - ${this.wordCount} words written`)

				this.sprintStarted = true
				this.sprintInterval = window.setInterval(() => {
					const currentNow = Date.now()
					const elapsedSeconds = Math.floor((currentNow - now) / 1000)

					const secondsLeft = secondsTotal - elapsedSeconds


					const secondsSinceLastWord = Math.floor(Date.now() - this.lastWordTime) / 1000
					if (secondsSinceLastWord >= 10 && !this.yellowNoticeShown) {
						new Notice("Keep on writing, this is a sprint!")
						this.yellowNoticeShown = true
						status = 'YELLOW'
					} else if (secondsSinceLastWord >= 60 && !this.redNoticeShown) {
						new Notice("Enjoy that break, get back to writing when you're back")
						this.redNoticeShown = true
						status = 'RED'
					} else if(secondsSinceLastWord < 10) {
						this.yellowNoticeShown = false
						this.redNoticeShown = false
						status = 'GREEN'
					}
					this.statusBarItemEl.setText(`Word Sprint - ${this.secondsToMMSS(secondsLeft)} left - ${this.wordCount} words written - ${status}`)

					if (secondsLeft <= 0) {
						window.clearInterval(this.sprintInterval)
						this.statusBarItemEl.setText('')
						new Notice(`Word Sprint Complete! Congratulations! Total words written: ${this.wordCount}`)
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
					new Notice(`Word Sprint Cancelled! Total words written: ${this.wordCount}`)
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
	}
}
