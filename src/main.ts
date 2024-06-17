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
import Settings from './settings'
import {SprintRunStat, WordSprintSettings} from './types'
import {getWordCount, secondsToHumanize} from './utils'
import SprintRun from "./SprintRun";
import StatView, {STAT_VIEW_TYPE} from "./StatView";
import {ICON_NAME, STATS_FILENAME} from "./constants";
import ChangeSprintTimeModal from "./ChangeSprintTimeModal";
import NanowrimoApi from "./nanowrimo-api";

const DEFAULT_SETTINGS: WordSprintSettings = {
	nanowrimoAuthToken: "",
	nanowrimoProjectChallengeId: 0,
	nanowrimoProjectId: 0,
	nanowrimoProjectName: 0,
	nanowrimoUserId: 0,
	sprintLength: 25,
	showLagNotices: true,
	showLeafUpdates: true,
	yellowNoticeTimeout: 10,
	yellowNoticeText: "Keep on writing, this is a sprint!",
	redNoticeTimeout: 50,
	redNoticeText: "Enjoy that break, get back to writing when you're back",
	dailyGoal: null,
	overallGoal: null,
	defaultTab: "stats",
	showEncouragementNotices: false,
	encouragementWordCount: 250,
	encouragementText: "Amazing job so far! Keep it going you're doing great!"
}

export default class WordSprintPlugin extends Plugin {
	settings: WordSprintSettings
	statusBarItemEl : HTMLElement
	debouncedUpdate: Debouncer<[contents: string, filepath: string], any>

	sprintInterval : number
	theSprint : SprintRun

	startButtonClicked : boolean = false
	startButtonClickedFirstLetter : boolean = false

	sprintHistory : SprintRunStat[] = []

	async emptyTotalStats() {
		await this.saveStats(`${STATS_FILENAME}-${Date.now()}`)
		this.sprintHistory = []
		await this.saveStats()
	}

	async emptyDailyStats() {
		this.sprintHistory = this.sprintHistory.filter((hist) => hist.created < moment().startOf('day').toDate().valueOf())
		await this.saveStats()
	}

	convertJsonToCsv(data: SprintRunStat[]): string {
		const headers = [
			"ID",
			"Name",
			"Sprint Length",
			"Elapsed Sprint Length",
			"Total Words Written",
			"Average Words Per Minute",
			"Yellow Notices",
			"Red Notices",
			"Longest Stretch Not Writing",
			"Total Time Not Writing",
			"Elapsed Milliseconds",
			"Words Added",
			"Words Deleted",
			"Words Net",
			"Created",
		];

		const csvRows = data.map((item) =>
			[
				item.id,
				item.name,
				item.sprintLength,
				item.elapsedSprintLength,
				item.totalWordsWritten,
				item.averageWordsPerMinute,
				item.yellowNotices,
				item.redNotices,
				item.longestStretchNotWriting,
				item.totalTimeNotWriting,
				item.elapsedMilliseconds,
				item.wordsAdded,
				item.wordsDeleted,
				item.wordsNet,
				moment(item.created).toISOString(),
			].map((value) => (typeof value === "string" ? `"${value}"` : value)).join(",")
		);

		return [headers.join(","), ...csvRows].join("\n");
	}

	async exportStats() {
		const adapter = this.app.vault.adapter;
		const dir = this.manifest.dir;
		const path = normalizePath(`${dir}/${STATS_FILENAME}`)
		let stats : string;

		const csvPath = normalizePath(`${this.app.vault.getRoot().path}/${moment().format('YYYY-MM-DD')} - Word Sprint.csv`)
		if (await adapter.exists(path)) {
			stats = await adapter.read(path)

			try {
				const statsAsJson = JSON.parse(stats) as SprintRunStat[]
				await adapter.write(csvPath, this.convertJsonToCsv(statsAsJson))
			} catch(error) {
				new Notice(`Unable to read ${STATS_FILENAME}`)
				console.error(error)
			}

		}
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

	async saveStats(statsFilename : string = STATS_FILENAME) {
		const adapter = this.app.vault.adapter;
		const dir = this.manifest.dir;
		const path = normalizePath(`${dir}/${statsFilename}`)

		if (this.settings.nanowrimoProjectId && this.settings.nanowrimoProjectChallengeId) {
			await this.updateNano(this.theSprint.getStats().totalWordsWritten)
		}

		try {
			await adapter.write(path, JSON.stringify(this.sprintHistory))
		} catch(error) {
			new Notice(`Unable to write to ${statsFilename} file`)
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
			id: 'show-word-sprint-leaf',
			name: 'Show Word Sprint Leaf',
			callback: () => {
				this.activateView()
			}
		})

		this.addCommand({
			id: 'insert-last-word-sprint-stats',
			name: 'Insert Last Word Sprint Stats',
			editorCallback: async (editor: Editor) => {
				let statsText : string = '';

				if (this.theSprint && this.theSprint.isStarted()) {
					new Notice("Sprint still going, but here's the stats as of this moment")
				}

				const stats = this.sprintHistory[this.sprintHistory.length - 1]

				statsText = `### Latest Word Sprint ${moment(stats.created).format('YYYY-MM-DD HH:mm:ss')}\n`
				if ((stats.sprintLength * 60) > stats.elapsedSprintLength) {
					statsText += `Sprint Length: ${secondsToHumanize(stats.elapsedSprintLength)} of ${secondsToHumanize(stats.sprintLength * 60)}\n`
				} else {
					statsText += `Sprint Length: ${secondsToHumanize(stats.sprintLength * 60)}\n`
				}
				statsText += `Total Words Written: ${stats.totalWordsWritten}\n`
				statsText += `Average Words Per Minute: ${numeral(stats.averageWordsPerMinute).format('0.0')}\n`
				statsText += `Yellow Notices: ${stats.yellowNotices}\n`
				statsText += `Red Notices: ${stats.redNotices}\n`
				statsText += `Longest Stretch Not Writing: ${secondsToHumanize(stats.longestStretchNotWriting)}\n`
				statsText += `Total Time Not Writing: ${secondsToHumanize(stats.totalTimeNotWriting)}\n`
				statsText += `Total Words Added: ${stats.wordsAdded}\n`
				statsText += `Total Words Deleted: ${stats.wordsDeleted}\n`
				statsText += `Total Net Words: ${stats.wordsNet}\n`

				editor.replaceSelection(statsText)
			}
		})
		this.addCommand({
			id: 'insert-average-word-sprint-stats',
			name: 'Insert Average Word Sprint Stats',
			editorCallback: async (editor: Editor) => {
				let statsText : string = '';

				if (this.theSprint && this.theSprint.isStarted()) {
					new Notice("Sprint still going, but here's the stats as of this moment")
				}

				statsText = '### Average Word Sprint Stats\n'
				const totalSprints = this.sprintHistory.length
				statsText += `Total Sprints: ${totalSprints}\n`
				const wordsWritten = this.sprintHistory.reduce((total: number, amount: SprintRunStat, currentIndex : number, array: SprintRunStat[]) => {
					total += amount.totalWordsWritten
					return total
				}, 0)
				statsText += `Total Words Written: ${numeral(wordsWritten).format('0.00')}\n`
				const totalSprintTime = this.sprintHistory.reduce((total: number, amount: SprintRunStat, currentIndex : number, array: SprintRunStat[]) => {
					total += amount.elapsedSprintLength
					return total
				}, 0)
				statsText += `Total Sprinting Time: ${secondsToHumanize(totalSprintTime)}\n`

				const averageSprintLength = this.sprintHistory.reduce((total: number, amount: SprintRunStat, currentIndex : number, array: SprintRunStat[]) => {
					total += amount.elapsedSprintLength
					return total
				}, 0) / totalSprints
				statsText += `Average Sprint Length: ${secondsToHumanize(averageSprintLength)}\n`

				const averageWPM = this.sprintHistory.reduce((total: number, amount: SprintRunStat, currentIndex : number, array: SprintRunStat[]) => {
					total += amount.averageWordsPerMinute
					return total
				}, 0) / totalSprints
				statsText += `Average Words per Minute: ${numeral(averageWPM).format('0.00')}\n`

				const redNotices = this.sprintHistory.reduce((total: number, amount: SprintRunStat, currentIndex : number, array: SprintRunStat[]) => {
					total += amount.redNotices
					return total
				}, 0)  / totalSprints
				statsText += `Average Red Notices: ${numeral(redNotices).format('0.00')}\n`

				const yellowNotices = this.sprintHistory.reduce((total: number, amount: SprintRunStat, currentIndex : number, array: SprintRunStat[]) => {
					total += amount.yellowNotices
					return total
				}, 0) / totalSprints
				statsText += `Average Yellow Notices: ${numeral(yellowNotices).format('0.00')}\n`

				const averageLongestStretchNotWriting = this.sprintHistory.reduce((total: number, amount: SprintRunStat, currentIndex : number, array: SprintRunStat[]) => {
					total += amount.longestStretchNotWriting
					return total
				}, 0) / totalSprints
				statsText += `Average Longest Stretches Not Writing: ${secondsToHumanize(averageLongestStretchNotWriting)}\n`

				const averageTimeNotWriting = this.sprintHistory.reduce((total: number, amount: SprintRunStat, currentIndex : number, array: SprintRunStat[]) => {
					total += amount.totalTimeNotWriting
					return total
				}, 0) / totalSprints
				statsText += `Average Time Not Writing: ${secondsToHumanize(averageTimeNotWriting)}\n`

				const wordsAdded = this.sprintHistory.reduce((total: number, amount: SprintRunStat, currentIndex : number, array: SprintRunStat[]) => {
					total += amount.wordsAdded
					return total
				}, 0) / totalSprints
				statsText += `Average Words Added: ${numeral(wordsAdded).format('0.00')}\n`

				const wordsDeleted = this.sprintHistory.reduce((total: number, amount: SprintRunStat, currentIndex : number, array: SprintRunStat[]) => {
					total += amount.wordsDeleted
					return total
				}, 0) / totalSprints
				statsText += `Average Words Deleted: ${numeral(wordsDeleted).format('0.00')}\n`

				const netWords = this.sprintHistory.reduce((total: number, amount: SprintRunStat, currentIndex : number, array: SprintRunStat[]) => {
					total += amount.wordsNet
					return total
				}, 0) / totalSprints
				statsText += `Average Net Words: ${numeral(netWords).format('0.00')}\n`

				editor.replaceSelection(statsText)
			}
		})

		this.addCommand({
			id: 'insert-all-word-sprint-stats-table',
			name: 'Insert All Word Sprint Stats Table',
			editorCallback: async (editor: Editor) => {

				let statsText : string = ''

				statsText += `### Word Sprints Table\n`
				statsText += '| # | Length | Total Words | Average Words | Yellow Notices | Red Notices | Longest Stretch Not Writing | Total Time Not Writing | Total Words Added | Total Words Deleted | Total Net Words |\n'
				statsText += '|---|--------|-------------|---------------|----------------|-------------|-----------------------------|------------------------|-------------------|---------------------|-----------------|\n'

				this.sprintHistory.forEach((sprint: SprintRunStat, index:number) => {
					statsText += `| ${index + 1}`
					statsText += `| ${sprint.sprintLength}`
					statsText += `| ${sprint.totalWordsWritten}`
					statsText += `| ${numeral(sprint.averageWordsPerMinute).format('0.0')}`
					statsText += `| ${sprint.yellowNotices}`
					statsText += `| ${sprint.redNotices}`
					statsText += `| ${secondsToHumanize(sprint.longestStretchNotWriting)}`
					statsText += `| ${secondsToHumanize(sprint.totalTimeNotWriting)}`
					statsText += `| ${sprint.wordsAdded}`
					statsText += `| ${sprint.wordsDeleted}`
					statsText += `| ${sprint.wordsNet}`
					statsText += '|\n'
				})

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
			id: 'toggle-word-sprint',
			name: 'Toggle Start/Stop Word Sprint',
			callback: async () => {
				if (this.theSprint && this.theSprint.isStarted()) {
					console.debug("Sprint running -- toggle = stopping")
					await this.stopWordSprint();
				} else {
					new Notice("A new Sprint has started")
					console.debug("No sprint running -- toggle = starting")
					this.startSprintCommand();
				}
			}
		})

		this.addCommand({
			id: 'change-word-sprint-length',
			name: 'Change Word Sprint Length',
			callback: () => {
				this.showChangeSprintTimeModal()
			}
		})

		this.addCommand({
			id: 'stop-word-sprint',
			name: 'Stop Word Sprint',
			callback: async () => {
				await this.stopWordSprint();
			}
		})
		this.addSettingTab(new Settings(this.app, this));
	}

	async stopWordSprint() {
		if (this.theSprint && this.theSprint.isStarted()) {
			this.statusBarItemEl.setText('')
			const sprintRunStat : SprintRunStat = this.theSprint.stop()
			this.showEndOfSprintStatsModal()

			this.sprintHistory.push(this.theSprint.getStats())
			await this.saveStats()

			this.theSprint = new SprintRun(this.settings.sprintLength, this.settings.yellowNoticeTimeout, this.settings.redNoticeTimeout)

			new Notice(`Word Sprint Cancelled! Total words written: ${sprintRunStat.totalWordsWritten}`)
		} else {
			new Notice('No Word Sprint running')
		}
	}

	async updateNano(count : number) {
		try {
			const nanowrimoApi = new NanowrimoApi(this.settings.nanowrimoAuthToken)
			const projectSession = await nanowrimoApi.updateProject(`${this.settings.nanowrimoProjectId}`, `${this.settings.nanowrimoProjectChallengeId}`, count)

			if (projectSession) {
				new Notice(`Updated NaNoWriMo project with latest sprint count: ${count}`)
			}
		} catch(error) {
			console.error(error)
			new Notice('Error occurred updating NaNoWriMo project with sprint count')
		}
	}

	startButtonUsed() {
		this.startButtonClicked = true
		this.startButtonClickedFirstLetter = true
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

		let encouragementNoticeCount = 0

		const sprintInterval = this.theSprint.start(previousWordCount, (status: string, statusChanged : boolean) => {
			const miniStats = this.theSprint.getMiniStats()

			if (this.settings.showEncouragementNotices) {
				const hitCount = Math.floor(miniStats.wordCount / this.settings.encouragementWordCount)
				if (hitCount > encouragementNoticeCount) {
					new Notice(this.settings.encouragementText)
				}
				encouragementNoticeCount = hitCount
			}
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

	showChangeSprintTimeModal() {
		if (this.theSprint.isStarted()) {
			new Notice("Cannot change sprint time during a sprint!")
		} else {
			new ChangeSprintTimeModal(this.app, this).open()
		}
	}

	showEndOfSprintStatsModal() {
		if (this.theSprint.isStarted()) {
			new EndOfSprintStatsModal(this.app, this.theSprint.getStats()).open()
		} else if (this.sprintHistory.length > 0) {
			new EndOfSprintStatsModal(this.app, this.sprintHistory, this.sprintHistory.length - 1).open()
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
				if (this.startButtonClicked && this.startButtonClickedFirstLetter) {
					this.theSprint.previousWordCount = getWordCount(contents) - 1
					this.startButtonClicked = false
					this.startButtonClickedFirstLetter = false
				}
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
