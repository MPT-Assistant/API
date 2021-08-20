type TWeek = "Знаменатель" | "Числитель" | "Не определено";

interface ILesson {
	num: number;
	name: [string, string?];
	teacher: [string, string?];
}

interface IDay {
	num: number;
	place: string;
	name: string;
	lessons: ILesson[];
}

interface IParsedGroup {
	name: string;
	days: IDay[];
}

interface IParsedSpecialty {
	name: string;
	groups: IParsedGroup[];
}

type TParsedSchedule = IParsedSpecialty[];

interface IParsedReplacement {
	num: number;
	old: {
		name: string;
		teacher: string;
	};
	new: {
		name: string;
		teacher: string;
	};
	updated: number;
}

interface IReplacementGroup {
	group: string;
	replacements: IParsedReplacement[];
}

interface IReplacementDay {
	date: number;
	groups: IReplacementGroup[];
}

type TParsedReplacements = IReplacementDay[];

export { TParsedReplacements, TParsedSchedule, TWeek };
