import * as React from "react"
import useInterval, {usePlugin} from './hooks'
import {SprintRunStat} from "./SprintRun";
import {secondsToMMSS} from "./utils";
import numeral from 'numeral';

export const StatReactView = () => {

	const plugin = usePlugin()

	useInterval(() => {
		const miniStats = plugin.theSprint.getMiniStats()
		setStatsAvailable(plugin.theSprint.getStats() !== null)

		setDailyWordCount(plugin.sprintHistory.filter((hist) => plugin.inRange(hist.created)).reduce((total: number, amount: SprintRunStat,) => {
			return total + amount.totalWordsWritten
		}, 0))
		setWordCount(miniStats.wordCount)

		if (plugin.theSprint && plugin.theSprint.isStarted()) {
			setSecondsLeft(miniStats.secondsLeft)
			setWordCount(miniStats.wordCount)
			setIsSprintStarted(plugin.theSprint.isStarted())
			setStatus(plugin.theSprint.status)
		} else {
			setIsSprintStarted(false)
		}

		if (plugin.sprintHistory && plugin.sprintHistory.length > 0) {
			setTotalWordCount(plugin.sprintHistory.reduce((total: number, amount: SprintRunStat,) => {
				return total + amount.totalWordsWritten
			}, 0))
		}
	}, 1000)

	const [activeTab, setActiveTab] = React.useState('stats')

	const [totalWordCount, setTotalWordCount] = React.useState(0)
	const [dailyWordCount, setDailyWordCount] = React.useState(0)

	const [wordCount, setWordCount] = React.useState(null)
	const [secondsLeft, setSecondsLeft] = React.useState(null)
	const [status, setStatus] = React.useState(null)
	const [statsAvailable, setStatsAvailable] = React.useState(false)
	const [isSprintStarted, setIsSprintStarted] = React.useState(false)

	const renderStatusName = (status : string) => {
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

			<hr />

			{/*
			<div id="sectionTab">
				<button className={`statsTab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => { setActiveTab('stats')}}>Stats</button>
				<button className={`goalsTab ${activeTab === 'goals' ? 'active' : ''}`} onClick={() => { setActiveTab('goals')}}>Goals</button>
			</div>
			*/}
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
			{/*
			{activeTab === 'goals' &&
				<div id="goalPanel">
					<div className="dailyGoal">
						Daily Goal: None
					</div>
					<div className="overallGoal">
						Overall Goal: None
					</div>
					<div id="sprintGoal">
						<button style={{backgroundColor: 'grey'}} className="goalPopup">Set Goals</button>
					</div>
				</div>
			}
			*/}
		</div>
	)
}
