import moment from "moment";

import { RouteShorthandOptions } from "fastify/types/route";
import server from "../../../../../lib/server";
import InternalUtils from "../../../../../lib/utils";
import { Replacement } from "../../../../../types/mpt";

interface Body {
	name?: string;
	date?: string;
}

const opts: RouteShorthandOptions = {
	schema: {
		body: {
			name: { type: "string" },
			date: { type: "string" },
		},
	},
};

const replacementUnificator = (replacement: Replacement) => ({
	date: moment(replacement.date).format("DD.MM.YYYY"),
	name: replacement.group,
	detected: replacement.detected,
	addToSite: replacement.addToSite,
	lessonNum: replacement.lessonNum,
	oldLessonName: replacement.oldLessonName,
	oldLessonTeacher: replacement.oldLessonTeacher,
	newLessonName: replacement.newLessonName,
	newLessonTeacher: replacement.newLessonTeacher,
});

server.post<{
	Body: Body;
}>("/api/replacements.get", opts, async (request) => {
	if (request.body.name) {
		const groupName = request.body.name.toLowerCase();

		if (
			!InternalUtils.MPT.data.groups.find(
				(group) => group.name.toLowerCase() === groupName,
			)
		) {
			throw new Error("Group not found");
		}

		return {
			response: InternalUtils.MPT.data.replacements
				.filter(
					(replacement) =>
						replacement.group.toLowerCase() === groupName.toLowerCase(),
				)
				.map(replacementUnificator),
		};
	} else {
		return {
			response: InternalUtils.MPT.data.replacements.map(replacementUnificator),
		};
	}
});
