import { RouteShorthandOptions } from "fastify/types/route";
import server from "../../main";
import InternalUtils from "../../../utils";
import moment from "moment";

interface IQuery {
	id: string;
}

const opts: RouteShorthandOptions = {
	schema: {
		querystring: {
			id: { type: "string" },
		},
	},
};

server.post<{
	Querystring: IQuery;
}>("/api/getCurrentReplacements", opts, async (request) => {
	if (request.query.id) {
		const groupID = request.query.id;

		const groupData = InternalUtils.MPT.data.groups.find(
			(group) => group.uid === groupID,
		);

		if (!groupData) {
			throw new Error("Group not found");
		}
		return {
			response: InternalUtils.MPT.data.replacements.filter(
				(replacement) => replacement.uid === groupID,
			),
		};
	} else {
		return {
			response: InternalUtils.MPT.data.replacements.map((replacement) => {
				return {
					date: moment(replacement.date).format("DD.MM.YYYY"),
					uid: replacement.uid,
					detected: replacement.detected,
					addToSite: replacement.addToSite,
					lessonNum: replacement.lessonNum,
					oldLessonName: replacement.oldLessonName,
					oldLessonTeacher: replacement.oldLessonTeacher,
					newLessonName: replacement.newLessonName,
					newLessonTeacher: replacement.newLessonTeacher,
				};
			}),
		};
	}
});
