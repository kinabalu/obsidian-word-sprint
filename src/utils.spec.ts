import { secondsToHumanize, secondsToMMSS } from './utils'

describe('secondsToHumanize', () => {
	it('should return 1 second given 1', () => {
		expect(secondsToHumanize(1)).toEqual('1 second')
	})

	it('should return 59 seconds given 59.2', () => {
		expect(secondsToHumanize(59.2)).toEqual('59 seconds')
	})

	it('should return 1 minute 1 second given 61', () => {
		expect(secondsToHumanize(61)).toEqual('1 minute 1 second')
	})

	it('should return 2 minutes 1 second given 121', () => {
		expect(secondsToHumanize(121)).toEqual('2 minutes 1 second')
	})

	it('should return 2 minutes 2 seconds given 122', () => {
		expect(secondsToHumanize(122)).toEqual('2 minutes 2 seconds')
	})

	it('should return 59 minutes 59 seconds given 3599.4', () => {
		expect(secondsToHumanize(3599.4)).toEqual('59 minutes 59 seconds')
	})

	it('should return 1 hour given 3599.5', () => {
		expect(secondsToHumanize(3599.5)).toEqual('1 hour')
	})

	it('should return 3 hours 2 seconds given 10802', () => {
		expect(secondsToHumanize(10802)).toEqual('3 hours 2 seconds')
	})

	it('should return 1 hour 2 minutes 2 seconds given 3722', () => {
		expect(secondsToHumanize(3722)).toEqual('1 hour 2 minutes 2 seconds')
	})

	it('should return 1 hour given 3600', () => {
		expect(secondsToHumanize(3600)).toEqual('1 hour')
	})
})

describe('secondsToMMSS', () => {
	it("should return 01:00 with 59.8", () => {
		expect(secondsToMMSS(59.8)).toEqual('01:00')
	})

	it("should return 00:59 with 58.999", () => {
		expect(secondsToMMSS(58.999)).toEqual('00:59')
	})

	it("should return 01:00 with 60.0", () => {
		expect(secondsToMMSS(60.0)).toEqual('01:00')
	})

	it("should return 00:59 with 59.2", () => {
		expect(secondsToMMSS(59.2)).toEqual('00:59')
	})

})
