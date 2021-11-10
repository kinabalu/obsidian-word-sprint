import SprintRun from "./SprintRun";

describe('SprintRun', () => {
	it('init a SprintRun gives a random UUID as id', () => {
		const sprintRun = new SprintRun(25, 10, 50)

		expect(sprintRun.id).toHaveLength(36)
	})

	it('init with sprintLength of 25 gives sprintLengthInMS of 1.5m', () => {
		const sprintRun = new SprintRun(25, 10, 50)
		expect(sprintRun.sprintLengthInMS).toEqual(1500000)
		expect(sprintRun.yellowNoticeTimeout).toEqual(10)
		expect(sprintRun.redNoticeTimeout).toEqual(50)
		expect(sprintRun.status).toEqual('GREEN')
	})

	it('init sprintLength of 25 and calling updateSprintLength initializes properly', () => {
		const sprintRun = new SprintRun(25, 10, 50)
		sprintRun.updateSprintLength(10)
		expect(sprintRun.sprintLengthInMS).toEqual(600000)
	})

	it('init yellow and red notice timeouts and calling updateNoticeTimeout change scorrectly', () => {
		const sprintRun = new SprintRun(25, 10, 50)
		sprintRun.updateNoticeTimeout(5, 10)
		expect(sprintRun.yellowNoticeTimeout).toEqual(5)
		expect(sprintRun.redNoticeTimeout).toEqual(10)
	})
})
