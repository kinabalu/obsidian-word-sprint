import {getWordCount, secondsToMMSS} from "./utils";

import {v4 as uuidv4} from 'uuid'
import {SprintRunStat, FileMetrics} from "./types";

export default class SprintRun {

	id : string = uuidv4()

	rand : number;
	sprintLength : number = 25
	sprintLengthInMS : number = this.sprintLength * 60 * 1000

	sprintInterval : number
	sprintStarted : boolean = false
	sprintComplete : boolean = false

	wordsLastCount: number = 0
	wordsAdded: number = 0
	wordsDeleted: number = 0

	lastWordTime : number = 0
	previousWordCount : number
	wordCount : number = 0

	yellowNoticeCount : number = 0
	redNoticeCount : number = 0
	longestWritingStretch : number = 0
	longestStretchNotWriting : number = 0
	totalTimeNotWriting : number = 0

	yellowNoticeShown : boolean = false
	redNoticeShown : boolean = false

	elapsedMilliseconds : number = 0
	millisecondsLeft : number = 0

	created : number
	status : string = "GREEN"

	private endOfSprintCallback : (sprintRunStat : SprintRunStat) => void

	yellowNoticeTimeout : number = 10
	redNoticeTimeout : number = 50

	private fileMetrics: Map<string, FileMetrics> = new Map();

	/**
	 * Construct a SprintRun instance
	 *
	 * @param sprintLength length of the SprintRun in minutes
	 * @param yellowNoticeTimeout timeout till a yellow notice
	 * @param redNoticeTimeout timeout till a red notice
	 */
	constructor(sprintLength : number, yellowNoticeTimeout : number, redNoticeTimeout : number) {
		this.sprintLength = sprintLength
		this.sprintLengthInMS = this.sprintLength * 60 * 1000

		this.millisecondsLeft = this.sprintLengthInMS

		this.yellowNoticeTimeout = yellowNoticeTimeout
		this.redNoticeTimeout = redNoticeTimeout
	}

	/**
	 * Update the sprintLength for this SprintRun
	 *
	 * @param sprintLength length of the SprintRun in minutes
	 */
	updateSprintLength(sprintLength : number) {
		this.sprintLength = sprintLength
		this.sprintLengthInMS = this.sprintLength * 60 * 1000
		if (!this.isStarted()) {
		   this.millisecondsLeft = this.sprintLengthInMS
		}
	}

	/**
	 * Update the yellow and red notice timeout
	 *
	 * @param yellowNoticeTimeout timeout till a yellow notice
	 * @param redNoticeTimeout timeout till a red notice
	 */
	updateNoticeTimeout(yellowNoticeTimeout : number, redNoticeTimeout : number) {
		this.yellowNoticeTimeout = yellowNoticeTimeout
		this.redNoticeTimeout = redNoticeTimeout
	}

	updateNotWriting(updateTime : number) {
		const secondsSinceLastWord = Math.floor((updateTime - this.lastWordTime)/1000) // don't count < 1 second gaps

		if (secondsSinceLastWord > this.longestStretchNotWriting) {
			this.longestStretchNotWriting = secondsSinceLastWord
		}
		this.totalTimeNotWriting += secondsSinceLastWord
	}

	public typingUpdate(contents: string, filepath: string): void {
		const currentNow = Date.now();
		this.updateNotWriting(currentNow);
		this.lastWordTime = currentNow;

		const wordCount = getWordCount(contents);
		const previousMetrics = this.fileMetrics.get(filepath) || { wordCount: 0, wordsAdded: 0, wordsDeleted: 0 };
		const netWords = wordCount - previousMetrics.wordCount;
		const wordsAdded = Math.max(netWords, 0);
		const wordsDeleted = Math.abs(Math.min(netWords, 0));

		this.fileMetrics.set(filepath, { wordCount, wordsAdded: previousMetrics.wordsAdded + wordsAdded, wordsDeleted: previousMetrics.wordsDeleted + wordsDeleted });
	}

	/**
	 * Returns true if this sprint run has been started
	 */
	isStarted(): boolean {
		return this.sprintStarted
	}

	/**
	 * Returns true if this sprint run is complete
	 */
	isComplete(): boolean {
		return this.sprintComplete
	}

	/**
	 * Start the sprint
	 *
	 * @param previousWordCount
	 * @param update
	 * @param endOfSprintCallback
	 */
	start(previousWordCount : number, update : (status : string, statusChanged : boolean) => void, endOfSprintCallback : (sprintRunStat : SprintRunStat) => void): number {
		this.endOfSprintCallback = endOfSprintCallback
		this.previousWordCount = previousWordCount
		this.wordsLastCount = previousWordCount

		const now = Date.now()
		this.created = now
		this.lastWordTime = now
		this.sprintStarted = true

		// reset all the stats
		this.yellowNoticeCount = 0
		this.redNoticeCount = 0
		this.longestWritingStretch = 0
		this.longestStretchNotWriting = 0
		this.totalTimeNotWriting = 0
		this.yellowNoticeShown = false
		this.redNoticeShown	= false

		this.sprintInterval = window.setInterval(() => {
			const currentNow = Date.now()
			this.elapsedMilliseconds = currentNow - now

			this.rand = Math.floor(Math.random() * (101));
			this.millisecondsLeft = this.sprintLengthInMS - this.elapsedMilliseconds

			const msSinceLastWord = Date.now() - this.lastWordTime

			let statusChanged = false
			if (msSinceLastWord >= this.yellowNoticeTimeout * 1000 && !this.yellowNoticeShown) {
				this.yellowNoticeShown = true
				this.status = 'YELLOW'
				this.yellowNoticeCount += 1
				statusChanged = true
			} else if (msSinceLastWord >= (this.yellowNoticeTimeout + this.redNoticeTimeout) * 1000 && !this.redNoticeShown) {
				this.redNoticeShown = true
				this.status = 'RED'
				this.redNoticeCount += 1
				statusChanged = true
			} else if(msSinceLastWord < this.yellowNoticeTimeout * 1000 && this.status !== 'GREEN') {
				this.yellowNoticeShown = false
				this.redNoticeShown = false
				this.status = 'GREEN'
				statusChanged = true
			}

			update(this.status, statusChanged)

			if (this.millisecondsLeft <= 0 && this.sprintStarted) {
				this.sprintStarted = false
				this.sprintComplete = true
				this.updateNotWriting(currentNow)
				window.clearInterval(this.sprintInterval)

				endOfSprintCallback(this.getStats())
			}
		}, 1000)

		return this.sprintInterval
	}

	/**
	 * Stop this sprint and return the latest stats
	 */
	stop(): SprintRunStat {
		if (this.sprintStarted) {
			// this must be called before we getStats(), otherwise the data will be missing
			this.updateNotWriting(Date.now())
			const stats = this.getStats()
			this.endOfSprintCallback(stats)
			this.sprintStarted = false
			this.sprintComplete = true
			window.clearInterval(this.sprintInterval)

			return stats
		}
		return null
	}

	getWordCountDisplay() : number {
		let wordCountDisplay : number = this.wordCount - this.previousWordCount
		return wordCountDisplay >= 0 ? wordCountDisplay : 0
	}

	getMiniStats() {
		const aggregateMetrics = Array.from(this.fileMetrics.values()).reduce(
			(acc, curr) => ({
				wordCount: acc.wordCount + curr.wordCount,
				wordsAdded: acc.wordsAdded + curr.wordsAdded,
				wordsDeleted: acc.wordsDeleted + curr.wordsDeleted,
			}),
			{ wordCount: 0, wordsAdded: 0, wordsDeleted: 0 }
		);

		return {
			secondsLeft: secondsToMMSS(this.millisecondsLeft / 1000),
			wordCount: aggregateMetrics.wordCount - this.previousWordCount,
		};
	}

	getStats() : SprintRunStat {
		const aggregateMetrics = Array.from(this.fileMetrics.values()).reduce(
			(acc, curr) => ({
				wordCount: acc.wordCount + curr.wordCount,
				wordsAdded: acc.wordsAdded + curr.wordsAdded,
				wordsDeleted: acc.wordsDeleted + curr.wordsDeleted,
			}),
			{ wordCount: 0, wordsAdded: 0, wordsDeleted: 0 }
		);

		let averageWordsPerMinute = (aggregateMetrics.wordCount - this.previousWordCount) * 1000 * 60 / Math.floor(Math.max(this.elapsedMilliseconds, 1));

		return {
			id: this.id,
			name: '',
			sprintLength: this.sprintLength,
			elapsedSprintLength: Math.floor(this.elapsedMilliseconds / 1000),
			totalWordsWritten: aggregateMetrics.wordCount - this.previousWordCount,
			averageWordsPerMinute: averageWordsPerMinute,
			yellowNotices: this.yellowNoticeCount,
			redNotices: this.redNoticeCount,
			longestStretchNotWriting: this.longestStretchNotWriting,
			totalTimeNotWriting: this.totalTimeNotWriting,
			elapsedMilliseconds: this.elapsedMilliseconds,
			wordsAdded: aggregateMetrics.wordsAdded,
			wordsDeleted: aggregateMetrics.wordsDeleted,
			wordsNet: aggregateMetrics.wordsAdded - aggregateMetrics.wordsDeleted,
			created: this.created,
		} as SprintRunStat;
	}
}
