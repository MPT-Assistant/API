import axios from "axios";
import cheerio, { CheerioAPI } from "cheerio";
import moment from "moment";

import {
	IDay,
	IParsedReplacementOnDay,
	IParsedSpecialty,
	ISpecialty,
	ISpecialtySite,
	ISpecialtySiteGroupLeaders,
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
] as const;

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
	private fixNonDecodeString(input: string): string {
		try {
			return decodeURI(
				input.replace("_2C ", ", ").replace("_2F", "/").replace(/_/gi, "%"),
			);
		} catch (error) {
			return input;
		}
	}

	private generateCookie(): string {
		const array = Array(8 + 1);
		const separator = (Math.random().toString(36) + "00000000000000000").slice(
			2,
			18,
		);
		return `PHPSESSID=MPT_Assistant#${array.join(separator).slice(0, 8)};`;
	}

	private async loadPage(url: string): Promise<CheerioAPI> {
		const html = (
			await axios.get(url, {
				headers: {
					cookie: this.generateCookie(), // Bypassing an error bad request (occurs with a large number of requests from one IP)
				},
			})
		).data;

		return cheerio.load(html);
	}

	public async getCurrentWeek(): Promise<TWeek> {
		const $ = await this.loadPage(
			"https://www.mpt.ru/studentu/raspisanie-zanyatiy/",
		);
		const parsedWeek = $("span.label").text().trim();
		if (parsedWeek === "Знаменатель") {
			return parsedWeek;
		} else if (parsedWeek === "Числитель") {
			return parsedWeek;
		} else {
			return "Не определено";
		}
	}

	public async getLessons(): Promise<TParsedSchedule> {
		const $ = await this.loadPage(
			"https://www.mpt.ru/studentu/raspisanie-zanyatiy/",
		);

		const specialtyList: TParsedSchedule = [];

		const schedule = $("div.tab-content:nth-child(6)");

		schedule.children().each((_index, element) => {
			const elem = $(element);
			const specialty: IParsedSpecialty = {
				name: elem
					.find("h2:nth-child(1)")
					.text()
					.trim()
					.replace("Расписание занятий для ", ""),
				groups: [],
			};

			const specialtyGroups = elem.find(".tab-content").first();

			specialtyGroups.children().each((_index, element) => {
				const elem = $(element);

				const groupsNames = this.fixNonDecodeString(
					elem.find("h3").text().trim(),
				)
					.replace("Группа ", "")
					.split(", ");

				const groupWeekSchedule: IDay[] = [];

				const weekSchedule = elem.find("table:nth-child(2)").children();
				weekSchedule.each((_index, element) => {
					const elem = $(element);
					if (elem.prop("name") === "tbody") {
						return;
					}

					const title = elem.find("h4");
					const placeName = title.find("span").text().trim();
					const dayName = title.text().replace(placeName, "").trim();

					const daySchedule: IDay = {
						num: days.findIndex((x) => new RegExp(x, "gi").test(dayName)),
						place: placeName.replace(/\(|\)/g, "") || "Отсутствует",
						lessons: [],
					};

					const schedule = elem.next().children();
					const notIncludedHtml = schedule.first().html();
					schedule.each((_index, element) => {
						const elem = $(element);
						if (notIncludedHtml === elem.html()) {
							return;
						}
						const lessonNum = Number(elem.find("td:nth-child(1)").text());

						if (lessonNum === 0) {
							return;
						}

						let lessonName: [string, string?];
						let teacherName: [string, string?];

						const lessonElement = elem.find("td:nth-child(2)");
						const teacherElement = elem.find("td:nth-child(3)");

						if (lessonElement.children().length === 0) {
							lessonName = [lessonElement.text().trim() || "Отсутствует"];
							teacherName = [teacherElement.text().trim() || "Отсутствует"];
						} else {
							lessonName = [
								lessonElement.find("div:nth-child(1)").text().trim(),
								lessonElement.find("div:nth-child(3)").text().trim(),
							];

							teacherName = [
								teacherElement.find("div:nth-child(1)").text().trim(),
								teacherElement.find("div:nth-child(3)").text().trim(),
							];
						}

						daySchedule.lessons.push({
							num: lessonNum,
							name: lessonName,
							teacher: teacherName,
						});
					});
					groupWeekSchedule.push(daySchedule);
				});

				specialty.groups.push(
					...groupsNames.map((name) => {
						return { name, days: groupWeekSchedule };
					}),
				);
			});

			specialtyList.push(specialty);
		});

		return specialtyList;
	}

	public async getReplacements(): Promise<TParsedReplacements> {
		const $ = await this.loadPage(
			"https://www.mpt.ru/studentu/izmeneniya-v-raspisanii/",
		);
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
				},
			);

			for (const tempReplacement of replacementsOnThisDay) {
				const replacementDay =
					replacementsList.find(
						(x: { date: number }) =>
							x.date === tempReplacementsOnDay.date.valueOf(),
					) ||
					replacementsList[
						replacementsList.push({
							date: tempReplacementsOnDay.date.valueOf(),
							groups: [],
						}) - 1
					];
				const groupWithReplacements =
					replacementDay.groups.find(
						(x: { group: string }) => x.group === tempReplacement.group,
					) ||
					replacementDay.groups[
						replacementDay.groups.push({
							group: tempReplacement.group,
							replacements: [],
						}) - 1
					];
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

	public async getReplacementsOnDay(
		date: Date = new Date(),
	): Promise<IParsedReplacementOnDay[]> {
		const $ = await this.loadPage(
			`https://www.mpt.ru/rasp-management/print-replaces.php?date=${moment(
				date,
			).format("YYYY-MM-DD")}`,
		);
		const replacementsList: IParsedReplacementOnDay[] = [];
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

	public async getSpecialtiesList(): Promise<ISpecialty[]> {
		const $ = await this.loadPage("https://mpt.ru/sites-otdels/");
		const list = $(".container-fluid > div:nth-child(1) > div:nth-child(3)");
		const response: ISpecialty[] = [];
		list.children().map((_index, element) => {
			const elem = $(element).find("a");
			const name = elem.text().trim();
			response.push({
				name,
				code: name.match(
					/(\d\d\.\d\d\.\d\d(?:(?:\([А-Я]+\))?)|Отделение первого курса)/g,
				)?.[0] as string,
				url: (elem.attr("href") as string).trim(),
			});
		});
		return response;
	}

	public async getSpecialtySite(
		specialty: string,
		specialtiesList?: ISpecialty[],
	): Promise<ISpecialtySite> {
		if (!specialtiesList) {
			specialtiesList = await this.getSpecialtiesList();
		}

		const regexp = new RegExp(
			specialty.replace(/[-\\/\\^$*+?.()|[\]{}]/g, "\\$&"),
			"ig",
		);

		const specialtyInfo = specialtiesList.find((x) => regexp.test(x.name));

		if (!specialtyInfo) {
			throw new Error("Specialty not found");
		}

		const response: ISpecialtySite = {
			...specialtyInfo,
			importantInformation: [],
			news: [],
			examQuestions: [],
			groupsLeaders: [],
		};

		const specialtySite = (await axios.get(specialtyInfo.url)).data;
		const $ = cheerio.load(specialtySite);

		const importantInformation = $(
			".col-sm-8 > div:contains(Важная информация!) > ul",
		);
		importantInformation.children().map((_index, element) => {
			const elem = $(element);
			const news = elem.find("a");
			const date = elem.find("div").text().trim();
			const name = news.text().trim();
			const url = "https://mpt.ru" + (news.attr("href") as string).trim();
			response.importantInformation.push({
				name,
				url,
				date: moment(date, "DD.MM.YYYY").toDate(),
			});
		});

		const groupsLeadersList = $(
			"div.block_no-margin:contains(Активы групп)",
		).find(".tab-content");
		groupsLeadersList.children().map((_index, element) => {
			const elem = $(element);
			const name = elem.find("h3").text().trim();

			const groupInfo: ISpecialtySiteGroupLeaders = {
				name,
				roles: [],
			};

			elem.find("table").map((_index, element) => {
				const elem = $(element);
				const [photo, role, name] = elem.find("tr").children();
				groupInfo.roles.push({
					photo: ("https://mpt.ru" +
						$(photo).find("img").attr("src")) as string,
					role: $(role).text().trim(),
					name: $(name).text().trim(),
				});
			});

			if (groupInfo.roles.length > 0) {
				response.groupsLeaders.push(groupInfo);
			}
		});

		const news = $(".col-sm-8 > div:contains(Новости) > ul");
		news.children().map((_index, element) => {
			const elem = $(element);
			const news = elem.find("a");
			const date = elem.find("div").text().trim();
			const name = news.text().trim();
			const url = "https://mpt.ru" + (news.attr("href") as string).trim();
			response.news.push({
				name,
				url,
				date: moment(date, "DD.MM.YYYY").toDate(),
			});
		});

		const examQuestions = $(".table-hover > tbody:nth-child(2)");
		examQuestions.children().map((_index, element) => {
			const elem = $(element);
			const document = elem.find("a");
			const name = document.text().trim();
			const url = "https://mpt.ru" + (document.attr("href") as string).trim();
			const date = elem.find("td:nth-child(2)").text().trim();
			response.examQuestions.push({
				name,
				url,
				date: moment(date, "DD.MM.YYYY HH:mm:ss").toDate(),
			});
		});

		return response;
	}
}

export default new MPT_Parser();
