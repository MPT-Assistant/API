type Week = "Знаменатель" | "Числитель" | "Не определено";

interface Lesson {
	num: number;
	name: [string, string?];
	teacher: [string, string?];
}

interface Day {
	num: number;
	place: string;
	name: string;
	lessons: Lesson[];
}

interface Group {
	id: string;
	uid: string;
	name: string;
	days: Day[];
}

interface Specialty {
	id: string;
	name: string;
	groups: Group[];
}

interface ParsedGroup {
	name: string;
	days: Day[];
}

interface ParsedSpecialty {
	name: string;
	groups: ParsedGroup[];
}

type ParsedSchedule = ParsedSpecialty[];

interface ParsedReplacement {
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

interface ReplacementGroup {
	group: string;
	replacements: ParsedReplacement[];
}

interface ReplacementDay {
	date: number;
	groups: ReplacementGroup[];
}

type ParsedReplacements = ReplacementDay[];

type Replacement = {
	date: Date;
	uid: string;
	detected: Date;
	addToSite: Date;
	lessonNum: number;
	oldLessonName: string;
	oldLessonTeacher: string;
	newLessonName: string;
	newLessonTeacher: string;
	hash: string;
};

export {
	Lesson,
	Group,
	Specialty,
	ParsedSchedule,
	ParsedReplacements,
	Week,
	Replacement,
};
