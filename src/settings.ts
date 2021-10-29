export interface WordSprintSettings {
	sprintLength: number;
	showLagNotices: boolean;
	yellowNoticeText : string;
	redNoticeText : string;
}

export interface WordsPerMinute {
	previous: number;
	now: number;
}
