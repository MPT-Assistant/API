import { RouteShorthandOptions } from "fastify/types/route";
import server from "../../main";
import InternalUtils from "../../../utils";
import { Group, Specialty } from "../../../../types/mpt";

interface IQuery {
	id: string;
}

const opts: RouteShorthandOptions = {
	schema: {
		querystring: {
			id: { type: "string" },
		},
	},
	preValidation: (request, reply, done) => {
		const { id } = request.query as IQuery;
		done(!id || id === "" ? new Error("Group ID not specified") : undefined);
	},
};

server.post<{
	Querystring: IQuery;
}>("/api/getGroupSchedule", opts, async (request) => {
	const groupID = request.query.id;

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
