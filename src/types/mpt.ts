type Week = "Знаменатель" | "Числитель" | "Не определено";

interface Lesson {
	num: number;
	name: [string, string?];
	teacher: [string, string?];
}

interface Group {
	id: string;
	name: string;
	lessons: Lesson[];
}

interface Specialty {
	id: string;
	name: string;
	groups: Group[];
}

type ParsedLesson = Lesson;

interface ParsedDay {
	num: number;
	place: string;
	name: string;
	lessons: ParsedLesson[];
}

interface ParsedGroup {
	name: string;
	days: ParsedDay[];
}

interface ParsedScheduleInterface {
	name: string;
	groups: ParsedGroup[];
}

type ParsedSchedule = ParsedScheduleInterface[];

export { Lesson, Group, Specialty, ParsedSchedule, Week };
