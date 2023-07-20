import * as React from "react"
import useInterval, {usePlugin} from './hooks'
import {secondsToMMSS} from "./utils";
import numeral from 'numeral';
import {SprintRunStat} from "./types";

export const StatReactView = () => {

	const plugin = usePlugin()

	useInterval(() => {
		setSprintLength(plugin.theSprint.sprintLength)
		const miniStats = plugin.theSprint.getMiniStats()
		setStatsAvailable(plugin.theSprint.getStats() !== null)

		setDailyWordCount(plugin.sprintHistory.filter((hist) => plugin.inRange(hist.created)).reduce((total: number, amount: SprintRunStat,) => {
			return total + amount.totalWordsWritten
		}, 0))
		setWordCount(miniStats.wordCount)

		setDailyGoal(plugin.settings.dailyGoal - dailyWordCount - miniStats.wordCount)
		setOverallGoal(plugin.settings.overallGoal - miniStats.wordCount - plugin.sprintHistory.reduce((total: number, amount: SprintRunStat,) => {
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

	const [sprintLength, setSprintLength] = React.useState(plugin.theSprint.sprintLength)

	const renderStatusName = (status : string) => {
		if (!plugin.settings.showLeafUpdates) {
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
		if (!plugin.settings.showLeafUpdates) {
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
		plugin.theSprint.stop()
	}

	const startSprint = () => {
		plugin.startButtonUsed()
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
					<div className="hand secondsLeft" onClick={() => { plugin.showChangeSprintTimeModal() }}>{secondsToMMSS(sprintLength * 60)}</div>
				</>
			)}
			<div id="sprintActionPanel">
				<button className="sprintStart" disabled={isSprintStarted} style={{ opacity: isSprintStarted ? 0.4 : 1 }} onClick={() => {startSprint()}}>Start</button>
				<button className="sprintStop"  disabled={!isSprintStarted} style={{ opacity: isSprintStarted ? 1 : 0.4 }} onClick={() => {stopSprint()}}>Stop</button>
			</div>

			{plugin.settings.nanowrimoProjectName &&
				<div id="nanowrimoProject">
					{plugin.settings.nanowrimoProjectName}
				</div>
			}
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
