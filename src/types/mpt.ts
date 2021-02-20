type Week = "Знаменатель" | "Числитель" | "Не определено";

type Lesson = {
	num: number;
	name: [string, string | null];
	teacher: [string, string | null];
};

type Group = {
	id: string;
	name: string;
	href: string;
	lessons: Lesson[];
};

type Specialty = {
	id: string;
	name: string;
	href: string;
	groups: Group[];
};

type ParsedSchedule = Array<{
	name: string;
	groups: Array<{
		name: string;
		days: Array<{
			num: number;
			place: string;
			name: string;
			lessons: Array<{
				num: number;
				name: [string, string?];
				teacher: [string, string?];
			}>;
		}>;
	}>;
}>;

export { Lesson, Group, Specialty, ParsedSchedule, Week };
