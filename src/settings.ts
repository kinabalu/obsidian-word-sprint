export interface WordSprintSettings {
	sprintLength: number;
	showLagNotices: boolean;
	yellowNoticeTimeout: number;
	yellowNoticeText : string;
	redNoticeTimeout: number;
	redNoticeText : string;
	dailyGoal: number;
	overallGoal: number;
	defaultTab: string;
}

export interface WordsPerMinute {
	previous: number;
	now: number;
}
