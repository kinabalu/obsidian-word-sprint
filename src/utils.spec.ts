import {secondsToMMSS} from "./utils";

it("should return 01:00 with 59.8", () => {
	const mmssText = secondsToMMSS(59.8)
	expect(mmssText).toEqual('01:00')
})

it("should return 00:59 with 58.999", () => {
	const mmssText = secondsToMMSS(58.999)
	expect(mmssText).toEqual('00:59')
})

it("should return 01:00 with 60.0", () => {
	const mmssText = secondsToMMSS(60.0)
	expect(mmssText).toEqual('01:00')
})

it("should return 00:59 with 59.2", () => {
	const mmssText = secondsToMMSS(59.2)
	expect(mmssText).toEqual('00:59')
})
