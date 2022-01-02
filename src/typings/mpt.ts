type TWeek = "Знаменатель" | "Числитель" | "Не определено";

interface ILesson {
	num: number;
	name: [string, string?];
	teacher: [string, string?];
}

interface IDay {
	num: number;
	place: string;
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

interface IParsedReplacementOnDay {
	group: string;
	replacements: Array<{
		num: number;
		old: {
			name: string;
			teacher: string;
		};
		new: {
			name: string;
			teacher: string;
		};
	}>;
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

interface ISpecialty {
	name: string;
	code: string;
	url: string;
}

interface SpecialtySiteItem {
	name: string;
	url: string;
	date: Date;
}

interface ISpecialtySiteGroupLeaders {
	name: string;
	roles: {
		photo: string;
		role: string;
		name: string;
	}[];
}

interface ISpecialtySite {
	name: string;
	code: string;
	url: string;
	importantInformation: SpecialtySiteItem[];
	news: SpecialtySiteItem[];
	examQuestions: SpecialtySiteItem[];
	groupsLeaders: ISpecialtySiteGroupLeaders[];
}

export {
	IDay,
	IParsedSpecialty,
	IParsedGroup,
	ISpecialty,
	ISpecialtySite,
	ISpecialtySiteGroupLeaders,
	TParsedReplacements,
	IParsedReplacementOnDay,
	TParsedSchedule,
	TWeek,
};
