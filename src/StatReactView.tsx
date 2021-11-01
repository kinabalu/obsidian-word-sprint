import * as React from "react"
import useInterval, {usePlugin} from './hooks'
import {secondsToMMSS} from "./utils";
import numeral from 'numeral';
import {SprintRunStat} from "./types";


/*

TODO: Get words added/deleted/net to fix the issue with 0 words when you've deleted a bunch of words.
TODO: Fix the bug with total time not writing, since it is 1 minute 1 second when in fact the sprint was only 1 minute.
This is probably a floor/ceiling/round issue, so that will need to be recitified. May have to do as recommended
originally for the timings in the MMSS function. Also, the sprint ended when the timer hit 1 second, so that
will need to be tested again and fix as necessary.
*/


export const StatReactView = () => {

	const plugin = usePlugin()

	useInterval(() => {
		const miniStats = plugin.theSprint.getMiniStats()
		setStatsAvailable(plugin.theSprint.getStats() !== null)

		setDailyWordCount(plugin.sprintHistory.filter((hist) => plugin.inRange(hist.created)).reduce((total: number, amount: SprintRunStat,) => {
			return total + amount.totalWordsWritten
		}, 0))
		setWordCount(miniStats.wordCount)

		setDailyGoal(plugin.settings.dailyGoal - dailyWordCount)
		setOverallGoal(plugin.settings.overallGoal - plugin.sprintHistory.reduce((total: number, amount: SprintRunStat,) => {
			return total + amount.totalWordsWritten
		}, 0))

		if (plugin.theSprint && plugin.theSprint.isStarted()) {
			setSecondsLeft(miniStats.secondsLeft)
			setWordCount(miniStats.wordCount)
			setIsSprintStarted(plugin.theSprint.isStarted())
			setStatus(plugin.theSprint.status)
		} else {
			if (plugin.theSprint) {
				setSecondsLeft(miniStats.secondsLeft)
			}
			setIsSprintStarted(false)
		}

		if (plugin.sprintHistory && plugin.sprintHistory.length > 0) {
			setTotalWordCount(plugin.sprintHistory.reduce((total: number, amount: SprintRunStat,) => {
				return total + amount.totalWordsWritten
			}, 0))
		}
	}, 1000)

	const [activeTab, setActiveTab] = React.useState(plugin.settings.defaultTab)

	const [totalWordCount, setTotalWordCount] = React.useState(0)
	const [dailyWordCount, setDailyWordCount] = React.useState(0)

	const [wordCount, setWordCount] = React.useState(null)
	const [secondsLeft, setSecondsLeft] = React.useState(null)
	const [status, setStatus] = React.useState<string>(null)
	const [statsAvailable, setStatsAvailable] = React.useState(false)
	const [isSprintStarted, setIsSprintStarted] = React.useState(false)

	const [dailyGoal, setDailyGoal] = React.useState(null)
	const [overallGoal, setOverallGoal] = React.useState(null)

	const renderStatusName = (status : string) => {
		if (!plugin.settings.showLagNotices) {
			return 'No Notices'
		}
		switch(status) {
			case 'GREEN':
				return 'Good'
			case 'RED':
				return 'Danger'
			case 'YELLOW':
				return 'Warning'
			default:
				return 'Not Started'
		}
	}

	const renderStatusClass = (status : string) => {
		if (!plugin.settings.showLagNotices) {
			return 'pending'
		}

		switch(status) {
			case 'GREEN':
				return 'success'
			case 'RED':
				return 'danger'
			case 'YELLOW':
				return 'warning'
			default:
				return 'pending'
		}
	}

	const stopSprint = () => {
		setStatus(null)
		plugin.theSprint.stopSprint()
	}

	const startSprint = () => {
		plugin.startSprintCommand()
	}

	return (
		<div id="wordsprint">
			{ isSprintStarted && (
				<>
					<div className={`status ${renderStatusClass(status)}`}>{renderStatusName(status)}</div>
					<div className="secondsLeft">{secondsLeft}</div>
					<div className="wordsWritten">{wordCount} words written</div>
				</>
			)}
			{ !isSprintStarted && (
				<>
					<div className={`status ${renderStatusClass(status)}`}>{renderStatusName(status)}</div>
					<div className="secondsLeft">{secondsToMMSS(plugin.theSprint.sprintLength * 60)}</div>
				</>
			)}
			<div id="sprintActionPanel">
				<button className="sprintStart" disabled={isSprintStarted} style={{ opacity: isSprintStarted ? 0.4 : 1 }} onClick={() => {startSprint()}}>Start</button>
				<button className="sprintStop"  disabled={!isSprintStarted} style={{ opacity: isSprintStarted ? 1 : 0.4 }} onClick={() => {stopSprint()}}>Stop</button>
			</div>

			<hr style={{ marginBottom: 0 }} />

			<div id="sectionTab" style={{ margin: 0, width: '100%'}}>
				<button style={{ width: '100%'}} className={`statsTab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => { setActiveTab('stats')}}>Stats</button>
				<button style={{ width: '100%'}} className={`goalsTab ${activeTab === 'goals' ? 'active' : ''}`} onClick={() => { setActiveTab('goals')}}>Goals</button>
			</div>
			{activeTab === 'stats' &&
				<div id="statsPanel">
					{totalWordCount > 0 &&
					<>
						<div className="sprintTotalWordCount">
							Total Word
							Count: {numeral(totalWordCount + plugin.theSprint.getStats().totalWordsWritten).format('0,0')}
						</div>
						<div className="sprintDailyWordCount">
							Daily Word
							Count: {numeral(dailyWordCount + plugin.theSprint.getStats().totalWordsWritten).format('0,0')}
						</div>
						<div className="sprintCount">
							Sprints: {numeral(plugin.sprintHistory.length).format('0,0')}
						</div>
					</>
					}
					{statsAvailable &&
					<div id="sprintViewStats">
						<button className="viewStats" onClick={() => {
							plugin.showEndOfSprintStatsModal()
						}}>View Stats
						</button>
					</div>
					}
				</div>
			}
			{activeTab === 'goals' &&
				<div id="goalsPanel">
					<div className="dailyGoal">
						Daily Goal: {numeral(dailyGoal).format('0,0')}
					</div>
					<div className="overallGoal">
						Overall Goal: {numeral(overallGoal).format('0,0')}
					</div>
				</div>
			}
		</div>
	)
}
