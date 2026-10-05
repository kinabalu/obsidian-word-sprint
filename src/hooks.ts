import {PluginContext} from "./context";
import * as React from "react"
import { useEffect, useRef } from 'react'
import WordSprintPlugin from "./main";

export const usePlugin = (): WordSprintPlugin | undefined => {
	return React.useContext(PluginContext);
};

export function useInterval(callback: () => void, delay : number) {
	const savedCallback = useRef<() => void>()

	useEffect(() => {
		savedCallback.current = callback
	}, [callback])

	useEffect(() => {
		function tick() {
			if (savedCallback.current) {
				savedCallback.current()
			}
		}
		const id = window.setInterval(tick, delay)
		return () => window.clearInterval(id)
	}, [delay])
}

export default useInterval
