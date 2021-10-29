import {PluginContext, SprintRunContext} from "./context";
import * as React from "react"
import { useEffect, useRef } from 'react'
import SprintRun from "./SprintRun";
import WordSprintPlugin from "../main";


export const useSprintRun = (): SprintRun | undefined => {
	return React.useContext(SprintRunContext);
};

export const usePlugin = (): WordSprintPlugin | undefined => {
	return React.useContext(PluginContext);
};

export function useInterval(callback: () => void, delay : number) {
	const savedCallback = useRef<() => void>()

	useEffect(() => {
		savedCallback.current = callback
	}, [callback])

	// eslint-disable-next-line consistent-return
	useEffect(() => {
		function tick() {
			if (savedCallback.current) {
				savedCallback.current()
			}
		}
		const id = setInterval(tick, delay)
		return () => clearInterval(id)
	}, [delay])
}

export default useInterval
