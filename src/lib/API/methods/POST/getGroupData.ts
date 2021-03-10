import { RouteShorthandOptions } from "fastify/types/route";
import server from "../../main";
import InternalUtils from "../../../utils";

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
}>("/api/getGroupData", opts, async (request) => {
	const selectedID = request.body.id;

	const findGroup = InternalUtils.MPT.data.groups.find(
		(group) => group.uid === selectedID,
	);

	if (!findGroup) {
		throw new Error("Group not found");
	} else {
		return {
			response: findGroup,
		};
	}
});
