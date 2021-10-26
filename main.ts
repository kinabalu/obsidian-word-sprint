import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

import numeral from 'numeral'

interface WordSprintSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: WordSprintSettings = {
	mySetting: 'default'
}

export default class WordSprintPlugin extends Plugin {
	settings: WordSprintSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: 'start-25-minute-word-sprint',
			name: 'Start 25 minute Word Sprint',
			callback: () => {
				let secondsTotal = 25 * 60
				let statusBarItemEl = this.addStatusBarItem()

				const now = Date.now()
				statusBarItemEl.setText('Word Sprint- 25:00 left')

				const sprintInterval = window.setInterval(() => {
					const currentNow = Date.now()
					const elapsedSeconds = Math.floor((currentNow - now) / 1000)

					const secondsLeft = secondsTotal - elapsedSeconds
					const minutes = Math.floor(secondsLeft / 60)
					const seconds = Math.ceil(secondsLeft % 60)
					statusBarItemEl.setText(`Word Sprint - ${numeral(minutes).format('00')}:${numeral(seconds).format('00')} left`)

					if (secondsLeft <= 0) {
						window.clearInterval(sprintInterval)
						statusBarItemEl.setText('')
						new Notice('Word Sprint Complete! Congratulations!')
					}
				}, 1000)
				this.registerInterval(sprintInterval);
			}
		})
		this.addSettingTab(new WordSprintSettingsTab(this.app, this));
	}

	onunload() {

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
	}
}
