import * as React from "react"
import useInterval, {usePlugin, useSprintRun} from './hooks'
import EndOfSprintStatsModal from "./EndOfSprintStatsModal";

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
	}, 1000)

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
		<div align="center">
			<h4>Word Sprint</h4>
			{ isSprintStarted && (
				<>
					<div style={{ margin: '2rem', padding: '0.5rem', color: renderForegroundColorStatus(status), backgroundColor: renderBackgroundColorStatus(status)}}>STATUS: {renderStatusName(status)}</div>
					<div style={{ margin: '2rem'}}>{secondsLeft} left</div>
					<div style={{ margin: '2rem'}}>{wordCount} words written</div>
				</>
			)}
			<button disabled={isSprintStarted} style={{ backgroundColor: 'green', opacity: isSprintStarted ? 0.4 : 1 }} onClick={() => {plugin.startSprintCommand()}}>Start</button>
			<button disabled={!isSprintStarted} style={{ backgroundColor: 'red', opacity: isSprintStarted ? 1 : 0.4 }} onClick={() => {sprintRun.stopSprint()}}>Stop</button>

			{statsAvailable &&
				<div style={{margin: '2rem'}}>
					<button onClick={() => {
						plugin.showEndOfSprintStatsModal()
					}}>View Stats
					</button>
				</div>
			}
		</div>
	)
}
