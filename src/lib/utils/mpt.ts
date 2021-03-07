import axios from "axios";
import cheerio from "cheerio";
import { ParsedReplacements, ParsedSchedule, Week } from "../../types/mpt";

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

const parseTeachers = (
	input: string,
): {
	teachers: string;
	input: string;
} => {
	if (
		/(([А-Я]\.[А-Я]\. [А-Я][а-я]+)?( \(.*\)))?(?:, )?(([А-Я]\.[А-Я]\. [А-Я][а-я]+)?( \(.*\)))/g.test(
			input,
		)
	) {
		const execResult = /(([А-Я]\.[А-Я]\. [А-Я][а-я]+)?( \(.*\)))?(?:, )?(([А-Я]\.[А-Я]\. [А-Я][а-я]+)?( \(.*\)))/g.exec(
			input,
		);
		if (!execResult) {
			return {
				teachers: "Отсутствует",
				input: input,
			};
		}
		return {
			teachers: [execResult[1], execResult[4]].join(", "),
			input: execResult.input.substring(0, execResult.index).trim(),
		};
	} else {
		const execResult = /([А-Я]\.[А-Я]\. [А-Я][а-я]+)?(?:, )?([А-Я]\.[А-Я]\. [А-Я][а-я]+)/g.exec(
			input,
		);
		if (!execResult) {
			return {
				teachers: "Отсутствует",
				input: input,
			};
		}
		return {
			teachers: execResult[0],
			input: execResult.input.substring(0, execResult.index).trim(),
		};
	}
};

class MPT {
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	constructor() {}

	public async getCurrentWeek(InputHTML?: string): Promise<Week> {
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
	}

	public async parseLesson(InputHTML?: string): Promise<ParsedSchedule> {
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
	}

	public async parseReplacements(
		InputHTML?: string,
	): Promise<ParsedReplacements> {
		const ReplacementsHTML =
			InputHTML ||
			(
				await axios.get(
					"https://www.mpt.ru/studentu/izmeneniya-v-raspisanii/",
					{
						headers: {
							cookie: `PHPSESSID=MPT_Assistant#${Array(8 + 1)
								.join(
									(Math.random().toString(36) + "00000000000000000").slice(
										2,
										18,
									),
								)
								.slice(0, 8)};`, // Bypassing an error bad request (occurs with a large number of requests from one IP)
						},
					},
				)
			).data;
		const $ = cheerio.load(ReplacementsHTML);
		const ReplacementsParsedList = $(
			$("body > div.page > main > div > div > div:nth-child(3)").children(),
		);

		const ReplacementsList: ParsedReplacements = [];

		// console.log(ReplacementsParsedList);

		const TempReplacementsOnDay: {
			date: Date;
			replacements: Array<{
				group: string;
				num: number;
				oldLesson: string;
				newLesson: string;
				updated: Date;
			}>;
		} = {
			date: new Date(0),
			replacements: [],
		};

		const processReplacementsOnDay = () => {
			const ReplacementsOnThisDay = TempReplacementsOnDay.replacements.map(
				(tempReplacement) => {
					const oldLessonData = parseTeachers(tempReplacement.oldLesson);
					const newLessonData = parseTeachers(tempReplacement.newLesson);
					return {
						group: tempReplacement.group,
						num: tempReplacement.num,
						oldLessonTeacher: oldLessonData.teachers,
						oldLessonName: oldLessonData.input,
						newLessonTeacher: newLessonData.teachers,
						newLessonName: newLessonData.input,
						updated: tempReplacement.updated.valueOf(),
					};
				},
			);

			for (const tempReplacement of ReplacementsOnThisDay) {
				const ReplacementDay =
					ReplacementsList.find(
						(x) => x.date === TempReplacementsOnDay.date.valueOf(),
					) ||
					ReplacementsList[
						ReplacementsList.push({
							date: TempReplacementsOnDay.date.valueOf(),
							groups: [],
						}) - 1
					];
				const GroupWithReplacements =
					ReplacementDay.groups.find(
						(x) => x.group === tempReplacement.group,
					) ||
					ReplacementDay.groups[
						ReplacementDay.groups.push({
							group: tempReplacement.group,
							replacements: [],
						}) - 1
					];
				GroupWithReplacements.replacements.push({
					num: tempReplacement.num,
					new: {
						name: tempReplacement.newLessonName,
						teacher: tempReplacement.newLessonTeacher,
					},
					old: {
						name: tempReplacement.oldLessonName,
						teacher: tempReplacement.oldLessonTeacher,
					},
					updated: tempReplacement.updated,
				});
			}
		};

		ReplacementsParsedList.each(function (_elementIndex, element) {
			const SelectedElement = $(element);
			if (SelectedElement.get()[0].name === "h4") {
				let ParsedDate = $($(SelectedElement).children()[0]).text();
				ParsedDate = ParsedDate.split(".").reverse().join("-");
				if (Number(TempReplacementsOnDay.date) !== 0) {
					processReplacementsOnDay();
				}
				TempReplacementsOnDay.date = new Date(ParsedDate);
			} else if (
				SelectedElement.get()[0].name === "div" &&
				SelectedElement.attr("class") === "table-responsive"
			) {
				const PreParsedData = SelectedElement.children().children();
				const GroupsNames = $($(PreParsedData[0]).children()[0])
					.text()
					.split(", ");
				for (const group of GroupsNames) {
					const ReplacementsTable = $(PreParsedData[1]).children();
					for (let i = 1; i < ReplacementsTable.length; i++) {
						const TempReplacement = $(ReplacementsTable[i]);

						const LessonNumber = TempReplacement.find(
							"td.lesson-number",
						).text();
						const OldLesson = TempReplacement.find("td.replace-from").text();
						const NewLesson = TempReplacement.find("td.replace-to").text();
						const UpdatedAt = TempReplacement.find("td.updated-at").text();

						TempReplacementsOnDay.replacements.push({
							group: group,
							num: Number(LessonNumber),
							oldLesson: OldLesson.trim(),
							newLesson: NewLesson.trim(),
							updated: new Date(
								UpdatedAt.split(` `)[0].split(`.`).reverse().join(`-`) +
									` ` +
									UpdatedAt.split(` `)[1],
							),
						});
					}
					// process.exit();
				}
			}
		});
		processReplacementsOnDay();

		return ReplacementsList;
	}
}

export default MPT;
