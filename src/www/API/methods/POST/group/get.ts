import { RouteShorthandOptions } from "fastify/types/route";
import server from "../../../../../lib/server";
import InternalUtils from "../../../../../lib/utils";

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
}>("/api/group.get", opts, async (request) => {
	const selectedGroupName = request.body.name;

	const findGroup = InternalUtils.MPT.data.groups.find(
		(group) => group.name.toLowerCase() === selectedGroupName,
	);

	if (!findGroup) {
		throw new Error("Group not found");
	} else {
		return {
			response: findGroup,
		};
	}
});
