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

	it("should initialize the fileMetrics property", () => {
		const sprintRun = new SprintRun(25, 10, 50);
		expect(sprintRun["fileMetrics"]).toBeInstanceOf(Map);
		expect(sprintRun["fileMetrics"].size).toBe(0);
	});
})

describe("typingUpdate", () => {
	it("should update the fileMetrics Map with the correct word count", () => {
		const sprintRun = new SprintRun(25, 10, 50);
		sprintRun.typingUpdate("Hello world", "file1.md");
		expect(sprintRun["fileMetrics"].get("file1.md")?.wordCount).toBe(2);
	});

	it("should update the fileMetrics Map with the correct words added and deleted", () => {
		const sprintRun = new SprintRun(25, 10, 50);
		sprintRun.typingUpdate("Hello world", "file1.md");
		sprintRun.typingUpdate("Hello world lorem ipsum", "file1.md");
		expect(sprintRun["fileMetrics"].get("file1.md")?.wordsAdded).toBe(4);
		expect(sprintRun["fileMetrics"].get("file1.md")?.wordsDeleted).toBe(0);
	});

	it("should handle metrics for multiple files", () => {
		const sprintRun = new SprintRun(25, 10, 50);
		sprintRun.typingUpdate("Hello world", "file1.md");
		sprintRun.typingUpdate("Lorem ipsum", "file2.md");
		expect(sprintRun["fileMetrics"].size).toBe(2);
		expect(sprintRun["fileMetrics"].get("file1.md")?.wordCount).toBe(2);
		expect(sprintRun["fileMetrics"].get("file2.md")?.wordCount).toBe(2);
	});
})

describe("getMiniStats and getStats", () => {
	beforeEach(() => {
		jest.useFakeTimers();
	  });
	  
	  afterEach(() => {
		jest.useRealTimers();
	  });
	it("should aggregate word count metrics across multiple files", () => {
		const sprintRun = new SprintRun(25, 10, 50);
		sprintRun.previousWordCount = 0;
		sprintRun.typingUpdate("Hello world", "file1.md");
		sprintRun.typingUpdate("Lorem ipsum", "file2.md");
		sprintRun.typingUpdate("Hello world lorem ipsum", "file1.md");

		const miniStats = sprintRun.getMiniStats();
		expect(miniStats.wordCount).toBe(6);

		jest.advanceTimersByTime(1000);
		const stats = sprintRun.getStats();
		expect(stats.totalWordsWritten).toBe(6);
		expect(stats.wordsAdded).toBe(6);
		expect(stats.wordsDeleted).toBe(0);
		expect(stats.wordsNet).toBe(6);
	});
})
