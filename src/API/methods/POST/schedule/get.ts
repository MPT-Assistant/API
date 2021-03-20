import { RouteShorthandOptions } from "fastify/types/route";
import server from "../../../../lib/server";
import InternalUtils from "../../../../lib/utils";
import { Group, Specialty } from "../../../../types/mpt";

interface Body {
	name: string;
}

const opts: RouteShorthandOptions = {
	schema: {
		body: {
			name: { type: "string" },
		},
	},
	preValidation: (request, reply, done) => {
		const { name } = request.body as Body;
		done(
			!name || name === "" ? new Error("Group name not specified") : undefined,
		);
	},
};

server.post<{
	Body: Body;
}>("/api/schedule.get", opts, async (request) => {
	const groupName = request.body.name;

	const groupData = InternalUtils.MPT.data.groups.find(
		(group) => group.name === groupName,
	);

	if (!groupData) {
		throw new Error("Group not found");
	}

	const specialtyData = InternalUtils.MPT.data.schedule.find(
		(specialty) => specialty.name === groupData.name,
	) as Specialty;

	const groupSchedule = specialtyData.groups.find(
		(group) => group.name === groupData.name,
	) as Group;

	return {
		response: groupSchedule.days,
	};
});
