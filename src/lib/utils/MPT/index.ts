import { SHA512 } from "crypto-js";
import { ISpecialty } from "../../../typings/mpt";

import internalUtils from "../index";
import parser from "./parser";

export default class MPT {
	public readonly parser = parser;

	public async updateGroupsList(): Promise<void> {
		const schedule = await this.parser.getLessons();
		const specialties = await this.parser.getSpecialtiesList();

		for (const specialty of schedule) {
			for (const group of specialty.groups) {
				let accurateSpecialty = specialties.find(
					(x) => x.code === specialty.name,
				);

				if (!accurateSpecialty) {
					const [groupSpecialtyCode] = group.name.match(
						/[А-Я]+/i,
					) as RegExpMatchArray;

					accurateSpecialty = specialties.find(
						(x) => x.code === specialty.name + `(${groupSpecialtyCode})`,
					) as ISpecialty;
				}

				const response = await internalUtils.DB.models.group.updateOne(
					{ name: group.name },
					{
						name: group.name,
						specialty: accurateSpecialty.code,
						schedule: group.days,
					},
				);

				if (response.matchedCount === 0) {
					await internalUtils.DB.models.group.insertMany({
						name: group.name,
						specialty: accurateSpecialty.code,
						schedule: group.days,
					});
				}
			}
		}

		for (const specialty of specialties) {
			const advancedSpecialtyInfo = await this.parser.getSpecialtySite(
				specialty.name,
				specialties,
			);

			const response = await internalUtils.DB.models.specialty.updateOne(
				{
					code: advancedSpecialtyInfo.code,
				},
				advancedSpecialtyInfo,
			);

			if (response.matchedCount === 0) {
				await internalUtils.DB.models.specialty.insertMany(
					advancedSpecialtyInfo,
				);
			}
		}
	}

	public async updateReplacementsList(): Promise<void> {
		const replacements = await this.parser.getReplacements();
		const insertedDocuments = [];

		for (const dayReplacements of replacements) {
			const date = dayReplacements.date;
			for (const groupReplacements of dayReplacements.groups) {
				const groupName = groupReplacements.group;
				for (const replacement of groupReplacements.replacements) {
					const hash = SHA512(
						`${date}|${groupName}|${JSON.stringify(replacement)}`,
					).toString();

					insertedDocuments.push({
						date: new Date(date),
						group: groupName,
						detected: new Date(),
						addToSite: new Date(replacement.updated),
						lessonNum: replacement.num,
						oldLessonName: replacement.old.name,
						oldLessonTeacher: replacement.old.teacher,
						newLessonName: replacement.new.name,
						newLessonTeacher: replacement.new.teacher,
						hash: hash,
					});
				}
			}
		}

		await internalUtils.DB.models.replacement
			.insertMany(insertedDocuments, {
				ordered: false,
			})
			.catch(() => null);
	}

	public async updateInfo(): Promise<void> {
		const currentWeek = await this.parser.getCurrentWeek();
		const info = await internalUtils.DB.models.info.findOne();

		if (!info) {
			await internalUtils.DB.models.info.insertMany({
				currentWeek,
				timetable: internalUtils.DB.timetable,
			});
		} else {
			info.currentWeek = currentWeek;

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			//@ts-ignore
			info.timetable = internalUtils.DB.timetable;
			await info.save();
		}
	}
}
