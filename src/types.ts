export interface WordSprintSettings {
	sprintLength: number;
	showLagNotices: boolean;
	showLeafUpdates: boolean;
	yellowNoticeTimeout: number;
	yellowNoticeText : string;
	redNoticeTimeout: number;
	redNoticeText : string;
	dailyGoal: number;
	overallGoal: number;
	defaultTab: string;
	showEncouragementNotices: boolean;
	encouragementWordCount: number;
	encouragementText: string;
	nanowrimoAuthToken: string;
	nanowrimoUserId: number;
	nanowrimoProjectId: number;
	nanowrimoProjectChallengeId: number;
	nanowrimoProjectName: number;
}

export interface SprintRunStat {
	id: string;
	name: string;
	created: number;
	sprintLength: number;
	elapsedSprintLength: number;
	totalWordsWritten: number;
	averageWordsPerMinute: number;
	yellowNotices: number;
	redNotices: number;
	longestStretchNotWriting: number;
	totalTimeNotWriting: number;
	elapsedMilliseconds: number;
	wordsAdded: number,
	wordsDeleted: number,
	wordsNet: number,
}

export interface FileMetrics {
	wordCount: number;
	wordsAdded: number;
	wordsDeleted: number;
}
