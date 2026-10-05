import {App, PluginSettingTab, Setting} from "obsidian";
import WordSprintPlugin from "./main";

export default class Settings extends PluginSettingTab {
	plugin: WordSprintPlugin;

	constructor(app: App, plugin: WordSprintPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Sprint length')
			.setDesc('In minutes')
			.addText((text) => {
				text.inputEl.type = 'number'
				text.setPlaceholder('25')
				text.setValue(`${this.plugin.settings.sprintLength}`)
					.onChange(async (value) => {
						this.plugin.settings.sprintLength = Number(value)
						this.plugin.theSprint.updateSprintLength(Number(value))
						await this.plugin.saveSettings();
					})
			})

		new Setting(containerEl)
			.setName('Notices when not writing')
			.setDesc('Default is on, provide helpful notices when you are not writing')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showLagNotices)
				.onChange(async (value: boolean) => {
					this.plugin.settings.showLagNotices = value
					await this.plugin.saveSettings()
				}))

		new Setting(containerEl)
			.setName('Status update in leaf when not writing')
			.setDesc('Default is on, provide status updates in leaf when you are not writing')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showLeafUpdates)
				.onChange(async (value: boolean) => {
					this.plugin.settings.showLeafUpdates = value
					await this.plugin.saveSettings()
				}))

		new Setting(containerEl)
			.setName('First notice when not writing')
			.setDesc(`After ${this.plugin.settings.yellowNoticeTimeout} seconds`)
			.addText(text => text
				.setValue(`${this.plugin.settings.yellowNoticeText}`)
				.onChange(async (value) => {
					this.plugin.settings.yellowNoticeText = value
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Receive first notice after')
			.setDesc('In seconds')
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
			.setDesc(`After ${this.plugin.settings.yellowNoticeTimeout + this.plugin.settings.redNoticeTimeout} seconds`)
			.addText(text => text
				.setValue(`${this.plugin.settings.redNoticeText}`)
				.onChange(async (value) => {
					this.plugin.settings.redNoticeText = value
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Receive second notice after')
			.setDesc('In seconds')
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

		new Setting(containerEl).setName('Goals').setHeading();

		new Setting(containerEl)
			.setName('Daily goal')
			.setDesc('Word count for your daily goal')
			.addText((text) => {
				text.setPlaceholder('1700')
				text.setValue(`${this.plugin.settings.dailyGoal}`)
					.onChange(async (value) => {
						this.plugin.settings.dailyGoal = Number(value)
						await this.plugin.saveSettings();
					})
				text.inputEl.type = 'number'
			})

		new Setting(containerEl)
			.setName('Overall goal')
			.setDesc('Word count for your overall goal')
			.addText((text) => {
				text.setPlaceholder('50000')
				text.setValue(`${this.plugin.settings.overallGoal}`)
					.onChange(async (value) => {
						this.plugin.settings.overallGoal = Number(value)
						await this.plugin.saveSettings();
					})
				text.inputEl.type = 'number'
			})

		new Setting(containerEl).setName('Encouragement').setHeading();

		new Setting(containerEl)
			.setName('Turn on encouragement notices for milestones')
			.setDesc('Default is off, but we think you are doing a great job either way')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showEncouragementNotices)
				.onChange(async (value: boolean) => {
					this.plugin.settings.showEncouragementNotices = value
					await this.plugin.saveSettings()
				}))

		new Setting(containerEl)
			.setName('Number of words before receiving encouragement')
			.addText((text) => {
				text.setPlaceholder('250')
				text.setValue(`${this.plugin.settings.encouragementWordCount}`)
					.onChange(async (value) => {
						this.plugin.settings.encouragementWordCount = Number(value)
						await this.plugin.saveSettings();
					})
				text.inputEl.type = 'number'
			})
		new Setting(containerEl)
			.setName('Message of encouragement when you hit the above word count')
			.setDesc('Shown each time')
			.addText(text => text
				.setValue(`${this.plugin.settings.encouragementText}`)
				.onChange(async (value) => {
					this.plugin.settings.encouragementText = value
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl).setName('Stats').setHeading();

		new Setting(containerEl)
			.setName('Export stats')
			.setDesc('Write all stats to a CSV file at the root of your vault')
			.addButton(button => button
				.setButtonText('Export stats')
				.onClick(async () => {
					await this.plugin.exportStats();
				})
			)

		new Setting(containerEl)
			.setName('Reset daily stats')
			.setDesc('Remove all stats calculated for the current day')
			.addButton(button => button
				.setButtonText('Reset daily stats')
				.onClick(async () => {
					await this.plugin.emptyDailyStats()
				})
			)

		new Setting(containerEl)
			.setName('Reset all stats')
			.setDesc('Archives and removes all stats shown for the tool')
			.addButton(button => button
				.setButtonText('Reset all stats')
				.onClick(async () => {
					await this.plugin.emptyTotalStats()
				})
			)
	}
}
