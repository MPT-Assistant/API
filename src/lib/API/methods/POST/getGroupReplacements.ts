import { RouteShorthandOptions } from "fastify/types/route";
import server from "../../main";
import InternalUtils from "../../../utils";
import DB from "../../../utils/DB";
import moment from "moment";

interface Body {
	id: string;
	from: number | Date;
	to: number | Date;
}

const opts: RouteShorthandOptions = {
	schema: {
		body: {
			id: { type: "string" },
		},
	},
	preValidation: (request, reply, done) => {
		const { id } = request.body as Body;
		let {
			from = new Date().valueOf(),
			to = new Date().valueOf() + 24 * 60 * 60 * 1000,
		} = request.body as Body;
		if (!id) {
			new Error("Group ID not specified");
		}
		try {
			from = new Date(from);
			to = new Date(to);
		} catch (error) {
			new Error("One of the time parameters is invalid");
		}
		if (Math.abs(Number(from) - Number(to)) > 7 * 24 * 60 * 60 * 1000) {
			new Error("Maximum interval one week");
		}
		(request.body as Body) = {
			id: id,
			from: new Date(from),
			to: new Date(to),
		};
		done();
	},
};

server.post<{
	Body: Body;
}>("/api/getGroupReplacements", opts, async (request) => {
	const selectedID = request.body.id;

	if (!InternalUtils.MPT.data.groups.find((group) => group.id === selectedID)) {
		throw new Error("Group not found");
	}

	const selectedReplacements = await DB.models.replacementModel.find({
		uid: selectedID,
		date: {
			$gt: new Date(request.body.from),
			$lt: new Date(request.body.to),
		},
	});

	return {
		response: selectedReplacements.map((replacement) => {
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
});
