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

export { Lesson, Group, Specialty };
