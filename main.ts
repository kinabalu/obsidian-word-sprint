import { App, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

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

	secondsToMMSS(seconds : number) {
		const minutes = Math.floor(seconds / 60)
		const secondsForFormatting = Math.ceil(seconds % 60)
		return `${numeral(minutes).format('00')}:${numeral(secondsForFormatting).format('00')}`
	}

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: 'start-word-sprint',
			name: 'Start Word Sprint',
			callback: () => {
				let secondsTotal = this.settings.sprintLength * 60
				this.statusBarItemEl = this.addStatusBarItem()

				const now = Date.now()
				this.statusBarItemEl.setText(`Word Sprint - ${this.secondsToMMSS(secondsTotal)} left`)

				this.sprintInterval = window.setInterval(() => {
					const currentNow = Date.now()
					const elapsedSeconds = Math.floor((currentNow - now) / 1000)

					const secondsLeft = secondsTotal - elapsedSeconds
					this.statusBarItemEl.setText(`Word Sprint - ${this.secondsToMMSS(secondsLeft)} left`)

					if (secondsLeft <= 0) {
						window.clearInterval(this.sprintInterval)
						this.statusBarItemEl.setText('')
						new Notice('Word Sprint Complete! Congratulations!')
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
					new Notice('Word Sprint Cancelled!')
					window.clearInterval(this.sprintInterval)
				} else {
					new Notice('No Word Sprint running')
				}
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
