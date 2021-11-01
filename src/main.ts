import {
	Notice,
	Plugin,
	debounce,
	TFile,
	MarkdownView,
	Debouncer,
	moment,
	Editor, normalizePath, addIcon,
} from 'obsidian';

import numeral from 'numeral'

import EndOfSprintStatsModal from './EndOfSprintStatsModal'
import WordSprintSettingsTab from './WordSprintSettingsTab'
import { WordSprintSettings } from './types'
import {getWordCount, secondsToHumanize} from './utils'
import SprintRun from "./SprintRun";
import {SprintRunStat} from "./types";
import StatView, {STAT_VIEW_TYPE} from "./StatView";
import {ICON_NAME, STATS_FILENAME} from "./constants";

const DEFAULT_SETTINGS: WordSprintSettings = {
	sprintLength: 25,
	showLagNotices: true,
	yellowNoticeTimeout: 10,
	yellowNoticeText: "Keep on writing, this is a sprint!",
	redNoticeTimeout: 50,
	redNoticeText: "Enjoy that break, get back to writing when you're back",
	dailyGoal: null,
	overallGoal: null,
	defaultTab: "stats",
}

export default class WordSprintPlugin extends Plugin {
	settings: WordSprintSettings
	statusBarItemEl : HTMLElement
	debouncedUpdate: Debouncer<[contents: string, filepath: string]>

	sprintInterval : number
	theSprint : SprintRun

	sprintHistory : SprintRunStat[] = []

	async emptyTotalStats() {
		this.sprintHistory = []
		await this.saveStats()
	}

	async emptyDailyStats() {
		this.sprintHistory = this.sprintHistory.filter((hist) => hist.created < moment().startOf('day').toDate().valueOf())
		await this.saveStats()
	}

	async loadStats() {
		const adapter = this.app.vault.adapter;
		const dir = this.manifest.dir;
		const path = normalizePath(`${dir}/${STATS_FILENAME}`)
		let stats : string;

		if (await adapter.exists(path)) {
			stats = await adapter.read(path)

			try {
				this.sprintHistory = JSON.parse(stats) as SprintRunStat[]
			} catch(error) {
				new Notice(`Unable to read ${STATS_FILENAME}`)
				console.error(error)
			}

		}
	}

	inRange(now : number) : boolean {
		return now >= moment().startOf('day').toDate().valueOf()
			&& now <= moment().endOf('day').toDate().valueOf()
	}

	async saveStats() {
		const adapter = this.app.vault.adapter;
		const dir = this.manifest.dir;
		const path = normalizePath(`${dir}/${STATS_FILENAME}`)

		try {
			await adapter.write(path, JSON.stringify(this.sprintHistory))
		} catch(error) {
			new Notice(`Unable to write to ${STATS_FILENAME} file`)
			console.error(error)
		}
	}

	async onload() {
		await Promise.all([this.loadSettings(), this.loadStats()])

		this.theSprint = new SprintRun(this.settings.sprintLength, this.settings.yellowNoticeTimeout, this.settings.redNoticeTimeout)

		addIcon(ICON_NAME, `<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="running" class="svg-inline--fa fa-running fa-w-13" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 416 512"><path fill="currentColor" d="M272 96c26.51 0 48-21.49 48-48S298.51 0 272 0s-48 21.49-48 48 21.49 48 48 48zM113.69 317.47l-14.8 34.52H32c-17.67 0-32 14.33-32 32s14.33 32 32 32h77.45c19.25 0 36.58-11.44 44.11-29.09l8.79-20.52-10.67-6.3c-17.32-10.23-30.06-25.37-37.99-42.61zM384 223.99h-44.03l-26.06-53.25c-12.5-25.55-35.45-44.23-61.78-50.94l-71.08-21.14c-28.3-6.8-57.77-.55-80.84 17.14l-39.67 30.41c-14.03 10.75-16.69 30.83-5.92 44.86s30.84 16.66 44.86 5.92l39.69-30.41c7.67-5.89 17.44-8 25.27-6.14l14.7 4.37-37.46 87.39c-12.62 29.48-1.31 64.01 26.3 80.31l84.98 50.17-27.47 87.73c-5.28 16.86 4.11 34.81 20.97 40.09 3.19 1 6.41 1.48 9.58 1.48 13.61 0 26.23-8.77 30.52-22.45l31.64-101.06c5.91-20.77-2.89-43.08-21.64-54.39l-61.24-36.14 31.31-78.28 20.27 41.43c8 16.34 24.92 26.89 43.11 26.89H384c17.67 0 32-14.33 32-32s-14.33-31.99-32-31.99z"></path></svg>`);

		this.registerView(
			STAT_VIEW_TYPE,
			(leaf) => new StatView(this, leaf),
		)

		this.addRibbonIcon(ICON_NAME, "Activate Word Sprint Leaf", () => {
			this.activateView()
		})
		this.registerEvent(
			this.app.workspace.on('quick-preview', this.onQuickPreview.bind(this))
		)

		this.addCommand({
			id: 'insert-last-word-sprint-stats',
			name: 'Insert Last Word Sprint Stats',
			editorCallback: async (editor: Editor) => {
				let statsText : string = '';

				if (this.theSprint && this.theSprint.isStarted()) {
					new Notice("Sprint still going, but here's the stats as of this moment")
				}

				const stats = this.theSprint.getStats()

				if ((stats.sprintLength * 60) > stats.elapsedSprintLength) {
					statsText = `Sprint Length: ${secondsToHumanize(stats.elapsedSprintLength)} of ${secondsToHumanize(stats.sprintLength * 60)}\n`
				} else {
					statsText = `Sprint Length: ${secondsToHumanize(stats.sprintLength * 60)}\n`
				}
				statsText += `Total Words Written: ${stats.totalWordsWritten}\n`
				statsText += `Average Words Per Minute: ${numeral(stats.averageWordsPerMinute).format('0.0')}\n`
				statsText += `Yellow Notices: ${stats.yellowNotices}\n`
				statsText += `Red Notices: ${stats.redNotices}\n`
				statsText += `Longest Stretch Not Writing: ${secondsToHumanize(stats.longestStretchNotWriting)}\n`
				statsText += `Total Time Not Writing: ${secondsToHumanize(stats.totalTimeNotWriting)}\n`

				editor.replaceSelection(statsText)
			}
		})
		this.addCommand({
			id: 'start-word-sprint',
			name: 'Start Word Sprint',
			callback: () => {
				this.startSprintCommand()
			}
		})

		this.addCommand({
			id: 'stop-word-sprint',
			name: 'Stop Word Sprint',
			callback: () => {
				if (this.theSprint && this.theSprint.isStarted()) {
					this.statusBarItemEl.setText('')
					const sprintRunStat : SprintRunStat = this.theSprint.stopSprint()
					this.showEndOfSprintStatsModal()

					this.sprintHistory.push(this.theSprint.getStats())
					this.saveStats()
					this.theSprint = new SprintRun(this.settings.sprintLength, this.settings.yellowNoticeTimeout, this.settings.redNoticeTimeout)

					new Notice(`Word Sprint Cancelled! Total words written: ${sprintRunStat.totalWordsWritten}`)
				} else {
					new Notice('No Word Sprint running')
				}
			}
		})
		this.addSettingTab(new WordSprintSettingsTab(this.app, this));
	}


	startSprintCommand() {
		if (this.theSprint && this.theSprint.isStarted()) {
			new Notice("Sprint already started! Please stop current sprint if you'd like to reset")
			return
		}

		if (this.theSprint.isComplete()) {
			this.sprintHistory.push(this.theSprint.getStats())
			this.saveStats()
			this.theSprint = new SprintRun(this.settings.sprintLength, this.settings.yellowNoticeTimeout, this.settings.redNoticeTimeout)
		} else {
			this.theSprint.updateSprintLength(this.settings.sprintLength)
			this.theSprint.updateNoticeTimeout(this.settings.yellowNoticeTimeout, this.settings.redNoticeTimeout)
		}

		let previousWordCount = 0
		if (this.app.workspace.getActiveViewOfType(MarkdownView)) {
			let viewData = this.app.workspace.getActiveViewOfType(MarkdownView).getViewData()
			previousWordCount = getWordCount(viewData)
		}
		this.statusBarItemEl = this.addStatusBarItem()
		this.debouncedUpdate = debounce((contents: string, filepath: string) => {
			this.theSprint.typingUpdate(contents, filepath)
		}, 400, false)

		const sprintInterval = this.theSprint.startSprint(previousWordCount, (status: string, statusChanged : boolean) => {
			const miniStats = this.theSprint.getMiniStats()

			if (statusChanged) {
				switch(status) {
					case 'YELLOW':
						this.settings.showLagNotices && new Notice(this.settings.yellowNoticeText)
						break
					case 'RED':
						this.settings.showLagNotices && new Notice(this.settings.redNoticeText)
						break
					default:
				}
			}
			this.statusBarItemEl.setText(`Word Sprint - ${miniStats.secondsLeft} left - ${miniStats.wordCount} words written`)
		},(sprintRunStat : SprintRunStat) => {
			this.sprintHistory.push(this.theSprint.getStats())
			this.saveStats()
			this.theSprint = new SprintRun(this.settings.sprintLength, this.settings.yellowNoticeTimeout, this.settings.redNoticeTimeout)

			window.clearInterval(this.sprintInterval)
			this.statusBarItemEl.setText('')
			new Notice(`Word Sprint Complete! Congratulations! Total words written: ${sprintRunStat.totalWordsWritten}`)
			new EndOfSprintStatsModal(this.app, sprintRunStat).open()
		})

		this.registerInterval(sprintInterval);
	}

	showEndOfSprintStatsModal() {
		if (this.theSprint.isStarted()) {
			new EndOfSprintStatsModal(this.app, this.theSprint.getStats()).open()
		} else if (this.sprintHistory.length > 0) {
			new EndOfSprintStatsModal(this.app, this.sprintHistory[0]).open()
		} else {
			new Notice("No stats found to show!")
		}
	}

	async onunload() {
		this.app.workspace.detachLeavesOfType(STAT_VIEW_TYPE)
	}

	async activateView() {
		this.app.workspace.detachLeavesOfType(STAT_VIEW_TYPE)

		await this.app.workspace.getRightLeaf(false).setViewState({
			type: STAT_VIEW_TYPE,
			active: true,
		})

		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(STAT_VIEW_TYPE)[0]
		)
	}

	onQuickPreview(file: TFile, contents: string) {
		if (this.app.workspace.getActiveViewOfType(MarkdownView)) {
			if (this.theSprint && this.theSprint.isStarted()) {
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
