import {App, PluginSettingTab, Setting, request} from "obsidian";
import WordSprintPlugin from "./main";
import {SprintRunStat} from "./types";
import NanowrimoApi from "./nanowrimo-api";

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
						this.plugin.theSprint.updateSprintLength(Number(value))
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

		let nanoUsername : string, nanoPassword : string = null

		containerEl.createEl('h2', {text: 'NanoWrimo'});

		if (this.plugin.settings.nanowrimoAuthToken && this.plugin.settings.nanowrimoUserId) {
			new Setting(containerEl)
				.setName('Project')
				.setDesc('Choose which project you would like to update word count for')
				.addDropdown(async (dropdown) => {
					const nanowrimoApi = new NanowrimoApi(this.plugin.settings.nanowrimoAuthToken)
					const projectsResponse = await nanowrimoApi.getProjects(`${this.plugin.settings.nanowrimoUserId}`)

					const options = projectsResponse.data.reduce((existing : any, project : any,) : any => {
						return {...existing, [project.id]: project.attributes.title}
					}, {0: 'Select A Project'})

					dropdown.addOptions(options)
					dropdown.setValue(`${this.plugin.settings.nanowrimoProjectId}`)
					dropdown.onChange(async (value) => {
						this.plugin.settings.nanowrimoProjectId = Number(value)
						this.plugin.settings.nanowrimoProjectName = options[value]

						await this.plugin.saveSettings();
					})
				})

			new Setting(containerEl)
				.setName('Project Challenge')
				.setDesc('Choose the project challenge you would like to update word count for')
				.addDropdown(async (dropdown) => {
					const nanowrimoApi = new NanowrimoApi(this.plugin.settings.nanowrimoAuthToken)
					const projectChallengesResponse = await nanowrimoApi.getProjectChallenges(`${this.plugin.settings.nanowrimoProjectId}`)

					const options = projectChallengesResponse.data.reduce((existing : any, projectChallenge : any,) : any => {
						return {...existing, [projectChallenge.id]: projectChallenge.attributes.name}
					}, {0: 'Select A Project'})

					dropdown.addOptions(options)
					dropdown.setValue(`${this.plugin.settings.nanowrimoProjectChallengeId}`)
					dropdown.onChange(async (value) => {
						this.plugin.settings.nanowrimoProjectChallengeId = Number(value)

						await this.plugin.saveSettings();
					})
				})

			new Setting(containerEl)
				.addButton(button => button
					.setButtonText("Logout")
					.onClick(async () => {
						delete this.plugin.settings.nanowrimoAuthToken
						delete this.plugin.settings.nanowrimoProjectId
						delete this.plugin.settings.nanowrimoProjectName
						delete this.plugin.settings.nanowrimoUserId

						await this.plugin.saveSettings();
					})
				)

		} else {
			new Setting(containerEl)
				.setName('Username')
				.addText((text) => {
					text.setPlaceholder('username')
					text.onChange(async (value) => {
						nanoUsername = value
					})
				})

			new Setting(containerEl)
				.setName('Password')
				.addText((text) => {
					text.setPlaceholder('password')
					text.inputEl.type = 'password'
					text.onChange(async (value) => {
						nanoPassword = value
					})
				})


			new Setting(containerEl)
				.addButton(button => button
					.setButtonText("Login")
					.onClick(async () => {
						const authToken = await NanowrimoApi.login(nanoUsername, nanoPassword)
						this.plugin.settings.nanowrimoAuthToken = authToken

						const nanowrimoApi = new NanowrimoApi(authToken)
						const userResponse = await nanowrimoApi.getUser(nanoUsername)

						this.plugin.settings.nanowrimoUserId = userResponse.data.id

						await this.plugin.saveSettings();
					})
				)
		}

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
