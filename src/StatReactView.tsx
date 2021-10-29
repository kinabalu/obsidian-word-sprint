import * as React from "react"
import useInterval, {usePlugin, useSprintRun} from './hooks'
import EndOfSprintStatsModal from "./EndOfSprintStatsModal";
import {WordsPerMinute} from "./settings";
import {SprintRunStat} from "./SprintRun";

export const StatReactView = () => {

	const plugin = usePlugin()
	const sprintRun = useSprintRun()

	useInterval(() => {
		setStatsAvailable(sprintRun.getStats() !== null)
		if (sprintRun && sprintRun.isStarted()) {
			const miniStats = sprintRun.getMiniStats()
			setSecondsLeft(miniStats.secondsLeft)
			setWordCount(miniStats.wordCount)
			setIsSprintStarted(sprintRun.isStarted())
			setStatus(sprintRun.status)
		} else {
			setIsSprintStarted(false)
		}

		if (plugin.sprintHistory.length > 0) {
			console.dir(plugin.sprintHistory)
			setTotalWordCount(plugin.sprintHistory.reduce((total: number, amount: SprintRunStat,) => {
				return total += amount.totalWordsWritten
			}, 0))
		}
	}, 1000)

	const [totalWordCount, setTotalWordCount] = React.useState(0)
	const [wordCount, setWordCount] = React.useState(null)
	const [secondsLeft, setSecondsLeft] = React.useState(null)
	const [status, setStatus] = React.useState('GREEN')
	const [statsAvailable, setStatsAvailable] = React.useState(false)
	const [isSprintStarted, setIsSprintStarted] = React.useState(false)

	const renderBackgroundColorStatus = (status : string) => {
		switch(status) {
			case 'GREEN':
				return 'green'
			case 'RED':
				return 'red'
			case 'YELLOW':
				return 'gold'
			default:
				return 'green'
		}
	}

	const renderForegroundColorStatus = (status : string) => {
		switch(status) {
			case 'GREEN':
				return 'white'
			case 'RED':
				return 'white'
			case 'YELLOW':
				return 'black'
			default:
				return 'white'
		}
	}

	const renderStatusName = (status : string) => {
		switch(status) {
			case 'GREEN':
				return 'Good'
			case 'RED':
				return 'Danger'
			case 'YELLOW':
				return 'Warning'
			default:
				return 'Good'
		}
	}

	return (
		<div>
			{ isSprintStarted && (
				<>
					<div style={{ margin: '0.5rem', padding: '0.5rem', color: renderForegroundColorStatus(status), backgroundColor: renderBackgroundColorStatus(status)}}>STATUS: {renderStatusName(status)}</div>
					<div style={{ margin: '0.5rem'}}>{secondsLeft} left</div>
					<div style={{ margin: '0.5rem'}}>{wordCount} words written</div>
				</>
			)}
			<div style={{ margin: '0.5rem'}}>
				<button disabled={isSprintStarted} style={{ backgroundColor: 'green', opacity: isSprintStarted ? 0.4 : 1 }} onClick={() => {plugin.startSprintCommand()}}>Start</button>
				<button disabled={!isSprintStarted} style={{ backgroundColor: 'red', opacity: isSprintStarted ? 1 : 0.4 }} onClick={() => {sprintRun.stopSprint()}}>Stop</button>
			</div>

			{statsAvailable &&
				<div style={{margin: '0.5rem'}}>
					<button style={{ backgroundColor: 'grey' }} onClick={() => {
						plugin.showEndOfSprintStatsModal()
					}}>View Stats
					</button>
				</div>
			}
			{totalWordCount > 0 &&
				<div align="center" style={{margin: '3rem'}}>
					Total Word Count: {totalWordCount}
				</div>
			}
		</div>
	)
}
