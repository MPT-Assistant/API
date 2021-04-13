import axios from "axios";
import cheerio from "cheerio";
import moment from "moment";

import CryptoJS from "crypto-js";

import InternalUtils from "../utils";
import Timetable from "../../DB/timetable.json";

import {
	Group,
	ParsedReplacements,
	ParsedSchedule,
	Replacement,
	Specialty,
	Week,
} from "../../types/mpt";

import { DaySchema } from "./DB/schemes";

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

const fixNonDecodeString = (input: string): string => {
	try {
		return decodeURI(
			input.replace("_2C ", ", ").replace("_2F", "/").replace(/_/gi, "%"),
		);
	} catch (error) {
		return input;
	}
};

interface MPT_Group {
	name: string;
	specialty: string;
}

interface MPT_Specialty {
	name: string;
	groups: Array<string>;
}

interface TimetableElement {
	num: number;
	type: "lesson" | "recess";
	start: {
		hour: number;
		minute: number;
	};
	end: {
		hour: number;
		minute: number;
	};
}

type TimetableType = TimetableElement[];

class MPT {
	public readonly data: {
		week: Week;
		schedule: Specialty[];
		replacements: Replacement[];
		groups: MPT_Group[];
		specialties: MPT_Specialty[];
		timetable: TimetableType;
		lastUpdate: Date;
	} = {
		week: "Не определено",
		schedule: [],
		replacements: [],
		groups: [],
		specialties: [],
		timetable: Timetable as TimetableType,
		lastUpdate: new Date(),
	};

	constructor() {
		return this;
	}

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

	public async parseLessons(InputHTML?: string): Promise<ParsedSchedule> {
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
					const GroupNamesText = $(SelectedGroupLessons.children()[0]).text();
					const GroupNames = fixNonDecodeString(GroupNamesText)
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
						let currentDayNum = 0;
						$(SelectedGroupLessons.children()[1])
							.children()
							.each(function (_dayIndex, dayElement) {
								const SelectedDay = $(dayElement);
								if (SelectedDay.prop("name") === "thead") {
									currentDayNum += 1;
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

									Place = Place.replace(/\(|\)/gi, "");
									Place === "" ? (Place = "Не указано") : null;

									const DayName = days[currentDayNum];

									const DayLessons = SelectedDay.next();
									const CurrentDay =
										CurrentGroup.days[
											CurrentGroup.days.push({
												num: currentDayNum,
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
													LessonTeacher[i] === "" || LessonTeacher[i] === "-"
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
					TempReplacementsOnDay.replacements = [];
				}
				TempReplacementsOnDay.date = new Date(ParsedDate);
			} else if (
				SelectedElement.get()[0].name === "div" &&
				SelectedElement.attr("class") === "table-responsive"
			) {
				const PreParsedData = SelectedElement.children().children();
				const GroupsNames = fixNonDecodeString(
					$($(PreParsedData[0]).children()[0]).text(),
				).split(", ");
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
				}
			}
		});
		processReplacementsOnDay();

		return ReplacementsList;
	}

	public async parseReplacementsOnDay(
		date: Date = new Date(),
	): Promise<
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
		const ReplacementsHTML = (
			await axios.get(
				"https://www.mpt.ru/rasp-management/print-replaces.php?date=" +
					moment(date).format("YYYY-MM-DD"),
			)
		).data;
		const $ = cheerio.load(ReplacementsHTML);
		const ReplacementsList: Array<{
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
				const SelectedReplacementList = $(replacementListElement);
				if (SelectedReplacementList.get()[0].name === "table") {
					for (const group of fixNonDecodeString(
						SelectedReplacementList.children().first().text(),
					).split(", ")) {
						const GroupReplacementsList =
							ReplacementsList[
								ReplacementsList.push({
									group: group,
									replacements: [],
								}) - 1
							];

						SelectedReplacementList.children()
							.next()
							.each(function replacementParser(
								_replacementIndex,
								replacementElement,
							) {
								const SelectedGroup = $(replacementElement);
								const SelectedReplacements = SelectedGroup.children();
								for (let i = 1; i < SelectedReplacements.length; i++) {
									const CurrentTable = $(SelectedReplacements[i]);
									const LessonNum = $(CurrentTable.children()[0]).text();
									const OldLesson = $(CurrentTable.children()[1]).text();
									const NewLesson = $(CurrentTable.children()[2]).text();
									const ParsedOldLesson = parseTeachers(OldLesson);
									const ParsedNewLesson = parseTeachers(NewLesson);
									GroupReplacementsList.replacements.push({
										num: Number(LessonNum),
										new: {
											name: ParsedNewLesson.input,
											teacher: ParsedNewLesson.teachers,
										},
										old: {
											name: ParsedOldLesson.input,
											teacher: ParsedOldLesson.teachers,
										},
									});
								}
							});
					}
				}
			});
		return ReplacementsList;
	}

	private async updateDataInDataBase(): Promise<void> {
		const sourceData = this.data;

		for (const group of sourceData.groups) {
			const currentSpecialty = sourceData.schedule.find(
				(specialty) => specialty.name === group.specialty,
			) as Specialty;
			const currentGroup = currentSpecialty.groups.find(
				(x) => x.name === group.name,
			) as Group;

			const groupSchedule = currentGroup.days;

			let groupData = await InternalUtils.API_DB.models.group.findOne({
				name: group.name,
			});

			if (!groupData) {
				groupData = new InternalUtils.API_DB.models.group({
					name: group.name,
					specialty: group.specialty,
					schedule: groupSchedule,
				});
			} else {
				groupData.schedule = groupSchedule as typeof DaySchema[];
			}

			await groupData.save();
		}

		for (const specialty of sourceData.specialties) {
			let currentSpecialty = await InternalUtils.API_DB.models.specialty.findOne(
				{
					name: specialty.name,
				},
			);
			if (!currentSpecialty) {
				currentSpecialty = new InternalUtils.API_DB.models.specialty({
					name: specialty.name,
					groups: specialty.groups.map((group) => group),
				});
			} else {
				currentSpecialty.groups = specialty.groups.map((group) => group);
			}
			await currentSpecialty.save();
		}

		for (const replacement of sourceData.replacements) {
			if (
				!(await InternalUtils.API_DB.models.replacement.findOne({
					hash: replacement.hash,
				}))
			) {
				await new InternalUtils.API_DB.models.replacement(replacement).save();
			}
		}

		const LastDump = await InternalUtils.API_DB.models.dump.findOne({});

		if (LastDump) {
			LastDump.data = this.data;
			LastDump.date = new Date();
			LastDump.markModified("data");
			await LastDump.save();
		} else {
			await new InternalUtils.API_DB.models.dump({
				date: new Date(),
				data: this.data,
			}).save();
		}
	}

	public async updateData(): Promise<void> {
		const CurrentWeek = await this.getCurrentWeek();
		const CurrentSchedule = await this.parseLessons();
		const CurrentReplacements = await this.parseReplacements();

		const ParsedSchedule: Specialty[] = [];
		const ParsedReplacements: Replacement[] = [];

		for (const specialty of CurrentSchedule) {
			const OutputSpecialty =
				ParsedSchedule[
					ParsedSchedule.push({
						name: specialty.name,
						groups: [],
					}) - 1
				];
			for (const tempGroup of specialty.groups) {
				if (
					!OutputSpecialty.groups.find((group) => group.name === tempGroup.name)
				) {
					OutputSpecialty.groups.push({
						name: tempGroup.name,
						days: tempGroup.days,
					});
				}
			}
		}

		for (const day of CurrentReplacements) {
			for (const group of day.groups) {
				for (const replacement of group.replacements) {
					const ReplacementHash = CryptoJS.SHA256(
						`${day.date} | ${group.group} / ${JSON.stringify(replacement)}`,
					).toString();
					const replacementInData = this.data.replacements.find(
						(replacement) => replacement.hash === ReplacementHash,
					);
					ParsedReplacements.push({
						date: new Date(day.date),
						group: group.group,
						detected: replacementInData
							? replacementInData.detected
							: new Date(),
						addToSite: new Date(replacement.updated),
						lessonNum: replacement.num,
						oldLessonName: replacement.old.name,
						oldLessonTeacher: replacement.old.teacher,
						newLessonName: replacement.new.name,
						newLessonTeacher: replacement.new.teacher,
						hash: ReplacementHash,
					});
				}
			}
		}

		const ParsedGroups: MPT_Group[] = [];

		const ParsedSpecialties: MPT_Specialty[] = [];

		for (const specialty of ParsedSchedule) {
			for (const group of specialty.groups) {
				ParsedGroups.push({
					name: group.name,
					specialty: specialty.name,
				});
			}
			ParsedSpecialties.push({
				name: specialty.name,
				groups: specialty.groups.map((group) => group.name),
			});
		}

		this.data.week = CurrentWeek;
		this.data.schedule = ParsedSchedule;
		this.data.replacements = ParsedReplacements;
		this.data.groups = ParsedGroups;
		this.data.specialties = ParsedSpecialties;
		this.data.lastUpdate = new Date();

		await this.updateDataInDataBase();
	}

	public async restoreData(): Promise<void> {
		const LastDump = await InternalUtils.API_DB.models.dump.findOne({});
		if (LastDump) {
			this.data.week = LastDump.data.week;
			this.data.groups = LastDump.data.groups;
			this.data.schedule = LastDump.data.schedule;
			this.data.specialties = LastDump.data.specialties;
			this.data.replacements = LastDump.data.replacements;
			this.data.lastUpdate = LastDump.data.lastUpdate;
		}
	}
}

export default MPT;
