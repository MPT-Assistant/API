import moment from "moment";

import { RouteShorthandOptions } from "fastify/types/route";
import server from "../../../../../lib/server";
import InternalUtils from "../../../../../lib/utils";
import { Group, Specialty, Week } from "../../../../../types/mpt";

interface Body {
	group: string;
	date: string;
	replacements?: boolean;
}

const opts: RouteShorthandOptions = {
	schema: {
		body: {
			group: { type: "string" },
		},
	},
	preValidation: (request, reply, done) => {
		const { group } = request.body as Body;
		done(
			!group || group === ""
				? new Error("Group name not specified")
				: undefined,
		);
	},
};

server.post<{
	Body: Body;
}>("/api/schedule.getByDate", opts, async (request) => {
	request.body.replacements = request.body.replacements || false;

	const selectedDate = moment(request.body.date || "", "DD.MM.YYYY");

	if (!selectedDate.isValid()) {
		throw new Error("Invalid date");
	}

	const groupName = request.body.group.toLowerCase();

	const groupData = InternalUtils.MPT.data.groups.find(
		(group) => group.name.toLowerCase() === groupName,
	);

	if (!groupData) {
		throw new Error("Group not found");
	}

	const specialtyData = InternalUtils.MPT.data.schedule.find(
		(specialty) => specialty.name === groupData.specialty,
	) as Specialty;

	const groupSchedule = specialtyData.groups.find(
		(group) => group.name === groupData.name,
	) as Group;

	const selectedDay = groupSchedule.days.find(
		(day) => day.num === selectedDate.day(),
	);

	if (!selectedDay) {
		throw new Error("Schedule on selected date not found");
	}

	let selectedDateWeekLegend: Week;

	const currentWeek = moment().week();
	if (currentWeek % 2 === selectedDate.week() % 2) {
		selectedDateWeekLegend = InternalUtils.MPT.data.week;
	} else {
		selectedDateWeekLegend =
			InternalUtils.MPT.data.week === "Знаменатель"
				? "Числитель"
				: "Знаменатель";
	}

	const response: {
		replacements: boolean;
		day: string;
		place: string;
		lessons: {
			num: number;
			name: string;
			teacher: string;
		}[];
	} = {
		replacements: false,
		day: selectedDay.name,
		place: selectedDay.place,
		lessons: [],
	};

	for (const lesson of selectedDay.lessons) {
		if (lesson.name.length === 1) {
			response.lessons.push({
				num: lesson.num,
				name: lesson.name[0],
				teacher: lesson.teacher[0],
			});
		} else {
			if (lesson.name[0] !== `-` && selectedDateWeekLegend === "Числитель") {
				response.lessons.push({
					num: lesson.num,
					name: lesson.name[0],
					teacher: lesson.teacher[0],
				});
			} else if (
				lesson.name[1] !== `-` &&
				selectedDateWeekLegend === "Знаменатель"
			) {
				response.lessons.push({
					num: lesson.num,
					name: lesson.name[1] as string,
					teacher: lesson.teacher[1] as string,
				});
			}
		}
	}

	if (request.body.replacements) {
		const selectedGroupReplacements = InternalUtils.MPT.data.replacements.filter(
			(replacement) =>
				replacement.group.toLowerCase() === groupData.name.toLowerCase() &&
				moment(replacement.date).format("DD.MM.YYYY") ===
					selectedDate.format("DD.MM.YYYY"),
		);

		if (selectedGroupReplacements.length > 0) {
			response.replacements = true;

			for (const replacement of selectedGroupReplacements) {
				const currentLesson = response.lessons.find(
					(lesson) => lesson.num === replacement.lessonNum,
				);

				if (!currentLesson) {
					response.lessons.push({
						num: replacement.lessonNum,
						name: replacement.newLessonName,
						teacher: replacement.newLessonTeacher,
					});
				} else {
					currentLesson.name = replacement.newLessonName;
					currentLesson.teacher = replacement.newLessonTeacher;
				}
			}

			response.lessons.sort((firstLesson, secondLesson) => {
				if (firstLesson.num > secondLesson.num) {
					return 1;
				} else if (firstLesson.num < secondLesson.num) {
					return -1;
				} else {
					return 0;
				}
			});
		}
	}

	return {
		response: response,
	};
});
