import axios from "axios";
import cheerio from "cheerio";
import moment from "moment";

import {
	TParsedReplacements,
	TParsedSchedule,
	TWeek,
} from "../../../typings/mpt";

const days = [
	"Воскресенье",
	"Понедельник",
	"Вторник",
	"Среда",
	"Четверг",
	"Пятница",
	"Суббота",
];

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
		const execResult =
			/(([А-Я]\.[А-Я]\. [А-Я][а-я]+)?( \(.*\)))?(?:, )?(([А-Я]\.[А-Я]\. [А-Я][а-я]+)?( \(.*\)))/g.exec(
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
		const execResult =
			/([А-Я]\.[А-Я]\. [А-Я][а-я]+)?(?:, )?([А-Я]\.[А-Я]\. [А-Я][а-я]+)/g.exec(
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

const fixNonDecodeString = (input: string): string => {
	try {
		return decodeURI(
			input.replace("_2C ", ", ").replace("_2F", "/").replace(/_/gi, "%"),
		);
	} catch (error) {
		return input;
	}
};

class MPT_Parser {
	constructor() {
		return this;
	}

	public async getCurrentWeek(inputHTML?: string): Promise<TWeek> {
		const lessonsHTML =
			inputHTML ||
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
		const $ = cheerio.load(lessonsHTML);
		const parsedWeek = $(
			$(
				$(
					"body > div.page > main > div > div > div:nth-child(3) > div.col-xs-12.col-sm-12.col-md-7.col-md-pull-5",
				).children()[1],
			)[0],
		)
			.text()
			.trim();
		if (parsedWeek === "Знаменатель") {
			return parsedWeek;
		} else if (parsedWeek === "Числитель") {
			return parsedWeek;
		} else {
			return "Не определено";
		}
	}

	public async parseLessons(inputHTML?: string): Promise<TParsedSchedule> {
		const lessonsHTML =
			inputHTML ||
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
		const $ = cheerio.load(lessonsHTML);
		const arrayWithAllFlow = $(
			`body > div.page > main > div > div > div:nth-child(3) > div.col-xs-12.col-sm-12.col-md-7.col-md-pull-5 > div.tab-content`,
		);

		const specialtyList: TParsedSchedule = [];

		arrayWithAllFlow
			.children()
			.each(function (_specialtyIndex, specialtyElement) {
				const selectedSpecialty = $(specialtyElement).children();
				const specialty: string = $(selectedSpecialty[0])
					.text()
					.replace("Расписание занятий для ", "");

				const currentSpecialty =
					specialtyList[
						specialtyList.push({
							name: specialty,
							groups: [],
						}) - 1
					];

				$(selectedSpecialty[1])
					.children()
					.each(function (_groupIndex, groupElement) {
						const selectedGroup = $($(groupElement).children()[0]);
						const groupID = selectedGroup.attr("aria-controls");
						const selectedGroupLessons = $(selectedSpecialty[2]).find(
							"#" + groupID,
						);
						const groupNamesText = $(selectedGroupLessons.children()[0]).text();
						const groupNames = fixNonDecodeString(groupNamesText)
							.replace("Группа ", "")
							.split(", ");
						for (const groupName of groupNames) {
							const currentGroup =
								currentSpecialty.groups[
									currentSpecialty.groups.push({
										name: groupName,
										days: [],
									}) - 1
								];
							let currentDayNum = 0;
							$(selectedGroupLessons.children()[1])
								.children()
								.each(function (_dayIndex, dayElement) {
									const selectedDay = $(dayElement);
									if (selectedDay.prop("name") === "thead") {
										currentDayNum += 1;
										let place: string;
										place = $(
											$(
												$(
													$($(selectedDay.children()[0]).children()[0]),
												).children()[0],
											).children()[0],
										)
											.text()
											.trim();

										place = place.replace(/\(|\)/gi, "");
										place === "" ? (place = "Не указано") : null;

										const dayName = days[currentDayNum];

										const dayLessons = selectedDay.next();
										const currentDay =
											currentGroup.days[
												currentGroup.days.push({
													num: currentDayNum,
													place: place,
													name: dayName,
													lessons: [],
												}) - 1
											];

										dayLessons
											.children()
											.each(function (_lessonIndex, lessonElement) {
												if (_lessonIndex !== 0) {
													const selectedLesson = $(lessonElement).children();
													if (selectedLesson.length > 0) {
														const LessonNum = $(selectedLesson[0]).text();
														let lessonName: [string, string?];
														let lessonTeacher: [string, string?];
														if ($(selectedLesson[1]).children().length !== 0) {
															lessonName = [
																$($(selectedLesson[1]).children()[0])
																	.text()
																	.trim(),
																$($(selectedLesson[1]).children()[2])
																	.text()
																	.trim(),
															];
														} else {
															lessonName = [$(selectedLesson[1]).text().trim()];
														}

														if ($(selectedLesson[2]).children().length !== 0) {
															lessonTeacher = [
																$($(selectedLesson[2]).children()[0])
																	.text()
																	.trim(),
																$($(selectedLesson[2]).children()[2])
																	.text()
																	.trim(),
															];
														} else {
															lessonTeacher = [
																$(selectedLesson[2]).text().trim(),
															];
														}

														for (let i = 0; i < lessonTeacher.length; i++) {
															lessonTeacher[i] === "" ||
															lessonTeacher[i] === "-"
																? (lessonTeacher[i] = "Отсутствует")
																: null;
														}

														currentDay.lessons.push({
															num: Number(LessonNum),
															name: lessonName,
															teacher: lessonTeacher,
														});
													}
												}
											});
									}
								});
						}
					});
			});

		return specialtyList;
	}

	public async parseReplacements(
		inputHTML?: string,
	): Promise<TParsedReplacements> {
		const ReplacementsHTML =
			inputHTML ||
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
		const replacementsParsedList = $(
			$("body > div.page > main > div > div > div:nth-child(3)").children(),
		);

		const replacementsList: TParsedReplacements = [];

		const tempReplacementsOnDay: {
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

		function processReplacementsOnDay() {
			const replacementsOnThisDay = tempReplacementsOnDay.replacements.map(
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
				}
			);

			for (const tempReplacement of replacementsOnThisDay) {
				const replacementDay = replacementsList.find(
					(x: { date: number; }) => x.date === tempReplacementsOnDay.date.valueOf()
				) ||
					replacementsList[replacementsList.push({
						date: tempReplacementsOnDay.date.valueOf(),
						groups: [],
					}) - 1];
				const groupWithReplacements = replacementDay.groups.find(
					(x: { group: string; }) => x.group === tempReplacement.group
				) ||
					replacementDay.groups[replacementDay.groups.push({
						group: tempReplacement.group,
						replacements: [],
					}) - 1];
				groupWithReplacements.replacements.push({
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
		}

		replacementsParsedList.each(function (_elementIndex, element) {
			const selectedElement = $(element);
			if (selectedElement.get()[0].name === "h4") {
				let parsedDate = $($(selectedElement).children()[0]).text();
				parsedDate = parsedDate.split(".").reverse().join("-");
				if (Number(tempReplacementsOnDay.date) !== 0) {
					processReplacementsOnDay();
					tempReplacementsOnDay.replacements = [];
				}
				tempReplacementsOnDay.date = new Date(parsedDate);
			} else if (
				selectedElement.get()[0].name === "div" &&
				selectedElement.attr("class") === "table-responsive"
			) {
				const PreParsedData = selectedElement.children().children();
				const GroupsNames = fixNonDecodeString(
					$($(PreParsedData[0]).children()[0]).text(),
				).split(", ");
				for (const group of GroupsNames) {
					const replacementsTable = $(PreParsedData[1]).children();
					for (let i = 1; i < replacementsTable.length; i++) {
						const tempReplacement = $(replacementsTable[i]);

						const lessonNumber = tempReplacement
							.find("td.lesson-number")
							.text();
						const oldLesson = tempReplacement.find("td.replace-from").text();
						const newLesson = tempReplacement.find("td.replace-to").text();
						const updatedAt = tempReplacement.find("td.updated-at").text();

						tempReplacementsOnDay.replacements.push({
							group: group,
							num: Number(lessonNumber),
							oldLesson: oldLesson.trim(),
							newLesson: newLesson.trim(),
							updated: new Date(
								updatedAt.split(` `)[0].split(`.`).reverse().join(`-`) +
									` ` +
									updatedAt.split(` `)[1],
							),
						});
					}
				}
			}
		});
		processReplacementsOnDay();

		return replacementsList;
	}

	public async parseReplacementsOnDay(date: Date = new Date()): Promise<
		Array<{
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
		}>
	> {
		const replacementsHTML = (
			await axios.get(
				"https://www.mpt.ru/rasp-management/print-replaces.php?date=" +
					moment(date).format("YYYY-MM-DD"),
			)
		).data;
		const $ = cheerio.load(replacementsHTML);
		const replacementsList: Array<{
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
		}> = [];
		$("body")
			.children()
			.each(function replacementsListParser(
				_replacementListIndex,
				replacementListElement,
			) {
				const selectedReplacementList = $(replacementListElement);
				if (selectedReplacementList.get()[0].name === "table") {
					for (const group of fixNonDecodeString(
						selectedReplacementList.children().first().text(),
					).split(", ")) {
						const groupReplacementsList =
							replacementsList[
								replacementsList.push({
									group: group,
									replacements: [],
								}) - 1
							];

						selectedReplacementList
							.children()
							.next()
							.each(function replacementParser(
								_replacementIndex,
								replacementElement,
							) {
								const selectedGroup = $(replacementElement);
								const selectedReplacements = selectedGroup.children();
								for (let i = 1; i < selectedReplacements.length; i++) {
									const currentTable = $(selectedReplacements[i]);
									const lessonNum = $(currentTable.children()[0]).text();
									const oldLesson = $(currentTable.children()[1]).text();
									const newLesson = $(currentTable.children()[2]).text();
									const parsedOldLesson = parseTeachers(oldLesson);
									const parsedNewLesson = parseTeachers(newLesson);
									groupReplacementsList.replacements.push({
										num: Number(lessonNum),
										new: {
											name: parsedNewLesson.input,
											teacher: parsedNewLesson.teachers,
										},
										old: {
											name: parsedOldLesson.input,
											teacher: parsedOldLesson.teachers,
										},
									});
								}
							});
					}
				}
			});
		return replacementsList;
	}
}

export default new MPT_Parser();