import {App, Modal, Setting} from "obsidian";
import WordSprintPlugin from "./main";

export default class ChangeSprintTimeModal extends Modal {
	plugin : WordSprintPlugin

	constructor(app: App, plugin : WordSprintPlugin) {
		super(app);
		this.plugin = plugin
	}

	isEnter(e: KeyboardEvent) {
		return (
			(e.keyCode === 13 || e.code === "Enter") &&
			e.shiftKey === false &&
			e.metaKey === false &&
			e.altKey === false &&
			e.ctrlKey === false
		);
	}

	async applyChange(newSprintLength : number, useAsDefaultSprintLength: boolean) {
		if (useAsDefaultSprintLength) {
			this.plugin.settings.sprintLength = Number(newSprintLength)
			await this.plugin.saveSettings();
		}
		this.plugin.theSprint.updateSprintLength(Number(newSprintLength))
	}

	onOpen() {
		let {contentEl} = this;

		let useAsDefaultSprintLength : boolean = false
		let newSprintLength : number = this.plugin.settings.sprintLength

		contentEl.createEl('h2', {text: 'Change Sprint Time'})

		new Setting(contentEl)
			.setName('New Sprint Length')
			.setDesc('(in minutes)')
			.addText((text) => {
				text.inputEl.type = 'number'
				text.inputEl.focus()
				text.inputEl.onkeydown = async (ev: KeyboardEvent) => {
					if (this.isEnter(ev)) {
						ev.preventDefault()
						await this.applyChange(newSprintLength, useAsDefaultSprintLength)
						this.close()
					}
				}
				text.setPlaceholder('25')
				text.setValue(`${this.plugin.settings.sprintLength}`)
					.onChange(async (value) => {
						newSprintLength = Number(value)
					})
			})

		new Setting(contentEl)
			.setName('Make sprint length default')
			.setDesc('Ensure this change for all future sprints')
			.addToggle(toggle => toggle
				.setValue(useAsDefaultSprintLength)
				.onChange(async (value: boolean) => {
					useAsDefaultSprintLength = value
				}))

		new Setting(contentEl)
			.addButton((button) => {
				button.setButtonText("Apply").onClick(async () => {
					await this.applyChange(newSprintLength, useAsDefaultSprintLength)
					this.close()
				})
			})
	}

	onClose() {
		this.plugin = null

		let {contentEl} = this;
		contentEl.empty();
	}
}
