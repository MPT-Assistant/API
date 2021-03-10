import { RouteShorthandOptions } from "fastify/types/route";
import server from "../../main";
import InternalUtils from "../../../utils";
import { Group, Specialty } from "../../../../types/mpt";

interface Body {
	id: string;
}

const opts: RouteShorthandOptions = {
	schema: {
		body: {
			id: { type: "string" },
		},
	},
	preValidation: (request, reply, done) => {
		const { id } = request.body as Body;
		done(!id || id === "" ? new Error("Group ID not specified") : undefined);
	},
};

server.post<{
	Body: Body;
}>("/api/getGroupSchedule", opts, async (request) => {
	const groupID = request.body.id;

	const groupData = InternalUtils.MPT.data.groups.find(
		(group) => group.uid === groupID,
	);

	if (!groupData) {
		throw new Error("Group not found");
	}

	const specialtyData = InternalUtils.MPT.data.schedule.find(
		(specialty) => specialty.id === groupData.specialtyID,
	) as Specialty;

	const groupSchedule = specialtyData.groups.find(
		(group) => group.id === groupData.id,
	) as Group;

	return {
		response: groupSchedule.days,
	};
});
