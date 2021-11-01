import {App, PluginSettingTab, Setting} from "obsidian";
import WordSprintPlugin from "./main";

export default class WordSprintSettingsTab extends PluginSettingTab {
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
			.addText((text) => {
				text.inputEl.type = 'number'
				text.setPlaceholder('25')
				text.setValue(`${this.plugin.settings.sprintLength}`)
					.onChange(async (value) => {
						this.plugin.settings.sprintLength = Number(value)
						await this.plugin.saveSettings();
					})
			})

		new Setting(containerEl)
			.setName('Notices when not writing')
			.setDesc('default is on, provide helpful notices when you are not writing')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showLagNotices)
				.onChange(async (value: boolean) => {
					this.plugin.settings.showLagNotices = value
					await this.plugin.saveSettings()
				}))

		new Setting(containerEl)
			.setName('First notice when not writing')
			.setDesc(`(after ${this.plugin.settings.yellowNoticeTimeout} seconds)`)
			.addText(text => text
				.setValue(`${this.plugin.settings.yellowNoticeText}`)
				.onChange(async (value) => {
					this.plugin.settings.yellowNoticeText = value
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Receive first notice after')
			.setDesc(`(in seconds)`)
			.addText((text) => {
				text.setPlaceholder('10')
				text.setValue(`${this.plugin.settings.yellowNoticeTimeout}`)
					.onChange(async (value) => {
						this.plugin.settings.yellowNoticeTimeout = Number(value)
						await this.plugin.saveSettings();
					})
				text.inputEl.type = 'number'
			})
		new Setting(containerEl)
			.setName('Second notice when not writing')
			.setDesc(`(after ${this.plugin.settings.yellowNoticeTimeout + this.plugin.settings.redNoticeTimeout} seconds)`)
			.addText(text => text
				.setValue(`${this.plugin.settings.redNoticeText}`)
				.onChange(async (value) => {
					this.plugin.settings.redNoticeText = value
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Receive second notice after')
			.setDesc(`(in seconds)`)
			.addText((text) => {
				text.setPlaceholder('50')
				text.setValue(`${this.plugin.settings.redNoticeTimeout}`)
					.onChange(async (value) => {
						this.plugin.settings.redNoticeTimeout = Number(value)
						await this.plugin.saveSettings();
					})
				text.inputEl.type = 'number'
			})

		new Setting(containerEl)
			.setName('Default tab')
			.setDesc('Choose which tab you would like to see by default')
			.addDropdown((dropdown) => {
				dropdown.addOptions({ stats: 'Stats', goals: 'Goals' })
					.setValue(this.plugin.settings.defaultTab)
					.onChange(async (value) => {
						this.plugin.settings.defaultTab = value
						await this.plugin.saveSettings()
					})
			})

		containerEl.createEl('h2', {text: 'Goals'});

		new Setting(containerEl)
			.setName('Daily Goal')
			.setDesc('Word Count for your daily goal')
			.addText((text) => {
				text.setPlaceholder('e.g. 1700')
				text.setValue(`${this.plugin.settings.dailyGoal}`)
					.onChange(async (value) => {
						this.plugin.settings.dailyGoal = Number(value)
						await this.plugin.saveSettings();
					})
				text.inputEl.type = 'number'
			})

		new Setting(containerEl)
			.setName('Overall Goal')
			.setDesc('Word Count for your overall goal')
			.addText((text) => {
				text.setPlaceholder('e.g. 50000')
				text.setValue(`${this.plugin.settings.overallGoal}`)
					.onChange(async (value) => {
						this.plugin.settings.overallGoal = Number(value)
						await this.plugin.saveSettings();
					})
				text.inputEl.type = 'number'
			})


		containerEl.createEl('h2', {text: 'Stats'});

		new Setting(containerEl)
			.setName('Reset daily stat')
			.setDesc('Remove all stats calculated for the current day')
			.addButton(button => button
				.setButtonText("Reset Daily Stats")
				.onClick(async () => {
					await this.plugin.emptyDailyStats()
				})
			)

		new Setting(containerEl)
			.setName('Reset all stats')
			.setDesc('Archives and remove all stats shown for the tool')
			.addButton(button => button
				.setButtonText("Reset All Stats")
				.onClick(async () => {
					await this.plugin.emptyTotalStats()
				})
			)
	}
}
