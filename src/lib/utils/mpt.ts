import axios from "axios";
import cheerio from "cheerio";
import { ParsedSchedule, Week } from "../../types/mpt";

const getDayNum = (day: string): number => {
	const days = [
		/воскресенье/gi,
		/понедельник/gi,
		/вторник/gi,
		/среда/gi,
		/четверг/gi,
		/пятница/gi,
		/суббота/gi,
	];

	return days.findIndex((x) => x.test(day) === true) || 0;
};

const parseLessons = async (InputHTML?: string): Promise<ParsedSchedule> => {
	const LessonsHTML =
		InputHTML ||
		(
			await axios.get("https://www.mpt.ru/studentu/raspisanie-zanyatiy/", {
				headers: {
					cookie: `PHPSESSID=MPT_Assistant#${Array(8 + 1)
						.join(
							(Math.random().toString(36) + "00000000000000000").slice(2, 18),
						)
						.slice(0, 8)};`, // Bypassing an error bad request (occurs with a large number of requests from one IP)
				},
			})
		).data;
	const $ = cheerio.load(LessonsHTML);
	const ArrayWithAllFlow = $(
		`body > div.page > main > div > div > div:nth-child(3) > div.col-xs-12.col-sm-12.col-md-7.col-md-pull-5 > div.tab-content`,
	);

	const SpecialtyList: ParsedSchedule = [];

	ArrayWithAllFlow.children().each(async function (
		_specialtyIndex,
		specialtyElement,
	) {
		const SelectedSpecialty = $(specialtyElement).children();
		const Specialty: string = $(SelectedSpecialty[0])
			.text()
			.replace("Расписание занятий для ", "");

		const CurrentSpecialty =
			SpecialtyList[
				SpecialtyList.push({
					name: Specialty,
					groups: [],
				}) - 1
			];

		$(SelectedSpecialty[1])
			.children()
			.each(function (_groupIndex, groupElement) {
				const SelectedGroup = $($(groupElement).children()[0]);
				const GroupID = SelectedGroup.attr("aria-controls");
				const SelectedGroupLessons = $(SelectedSpecialty[2]).find(
					"#" + GroupID,
				);
				const GroupNames = $(SelectedGroupLessons.children()[0])
					.text()
					.replace("Группа ", "")
					.split(", ");
				for (const GroupName of GroupNames) {
					const CurrentGroup =
						CurrentSpecialty.groups[
							CurrentSpecialty.groups.push({
								name: GroupName,
								days: [],
							}) - 1
						];
					$(SelectedGroupLessons.children()[1])
						.children()
						.each(function (_dayIndex, dayElement) {
							const SelectedDay = $(dayElement);
							if (SelectedDay.prop("name") === "thead") {
								let DayName: string;
								let Place: string;
								Place = $(
									$(
										$(
											$($(SelectedDay.children()[0]).children()[0]),
										).children()[0],
									).children()[0],
								)
									.text()
									.trim();

								DayName = $(
									$(
										$(
											$($(SelectedDay.children()[0]).children()[0]),
										).children()[0],
									),
								)
									.text()
									.replace(Place, "")
									.trim();

								Place = Place.replace(/\(|\)/gi, "");
								Place === "" ? (Place = "Не указано") : null;

								DayName = DayName[0] + DayName.slice(1).toLowerCase();

								const DayLessons = SelectedDay.next();
								const CurrentDay =
									CurrentGroup.days[
										CurrentGroup.days.push({
											num: getDayNum(DayName),
											place: Place,
											name: DayName,
											lessons: [],
										}) - 1
									];

								DayLessons.children().each(function (
									_lessonIndex,
									lessonElement,
								) {
									if (_lessonIndex !== 0) {
										const SelectedLesson = $(lessonElement).children();
										if (SelectedLesson.length > 0) {
											const LessonNum = $(SelectedLesson[0]).text();
											let LessonName: [string, string?];
											let LessonTeacher: [string, string?];
											if ($(SelectedLesson[1]).children().length !== 0) {
												LessonName = [
													$($(SelectedLesson[1]).children()[0]).text().trim(),
													$($(SelectedLesson[1]).children()[2]).text().trim(),
												];
											} else {
												LessonName = [$(SelectedLesson[1]).text().trim()];
											}

											if ($(SelectedLesson[2]).children().length !== 0) {
												LessonTeacher = [
													$($(SelectedLesson[2]).children()[0]).text().trim(),
													$($(SelectedLesson[2]).children()[2]).text().trim(),
												];
											} else {
												LessonTeacher = [$(SelectedLesson[2]).text().trim()];
											}

											for (let i = 0; i < LessonTeacher.length; i++) {
												LessonTeacher[i] === ""
													? (LessonTeacher[i] = "Отсутствует")
													: null;
											}

											CurrentDay.lessons.push({
												num: Number(LessonNum),
												name: LessonName,
												teacher: LessonTeacher,
											});
										}
									}
								});
							}
						});
				}
			});
	});

	return SpecialtyList;
};

// async function parseReplacements() {}

const getCurrentWeek = async (InputHTML?: string): Promise<Week> => {
	const LessonsHTML =
		InputHTML ||
		(
			await axios.get("https://www.mpt.ru/studentu/raspisanie-zanyatiy/", {
				headers: {
					cookie: `PHPSESSID=MPT_Assistant#${Array(8 + 1)
						.join(
							(Math.random().toString(36) + "00000000000000000").slice(2, 18),
						)
						.slice(0, 8)};`, // Bypassing an error bad request (occurs with a large number of requests from one IP)
				},
			})
		).data;
	const $ = cheerio.load(LessonsHTML);
	const ParsedWeek = $(
		$(
			$(
				"body > div.page > main > div > div > div:nth-child(3) > div.col-xs-12.col-sm-12.col-md-7.col-md-pull-5",
			).children()[1],
		)[0],
	)
		.text()
		.trim();
	if (ParsedWeek === "Знаменатель") {
		return ParsedWeek;
	} else if (ParsedWeek === "Числитель") {
		return ParsedWeek;
	} else {
		return "Не определено";
	}
};

export { parseLessons, getCurrentWeek };
