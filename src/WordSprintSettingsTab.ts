import {App, PluginSettingTab, Setting} from "obsidian";
import WordSprintPlugin from "../main";

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
			.addText(text => text
				.setPlaceholder('25')
				.setValue(`${this.plugin.settings.sprintLength}`)
				.onChange(async (value) => {
					this.plugin.settings.sprintLength = Number(value)
					await this.plugin.saveSettings();
				}));

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
			.setDesc('(after 10 seconds)')
			.addText(text => text
				.setValue(`${this.plugin.settings.yellowNoticeText}`)
				.onChange(async (value) => {
					this.plugin.settings.yellowNoticeText = value
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Second notice when not writing')
			.setDesc('(after 60 seconds)')
			.addText(text => text
				.setValue(`${this.plugin.settings.redNoticeText}`)
				.onChange(async (value) => {
					this.plugin.settings.redNoticeText = value
					await this.plugin.saveSettings();
				}));
	}
}
