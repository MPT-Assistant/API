import { RouteShorthandOptions } from "fastify/types/route";
import server from "../../main";
import InternalUtils from "../../../utils";

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
}>("/api/getGroupData", opts, async (request) => {
	const selectedID = request.query.id;

	const findGroup = InternalUtils.MPT.data.groups.find(
		(group) => group.id === selectedID,
	);

	if (!findGroup) {
		new Error("Group not found");
	} else {
		return {
			response: findGroup,
		};
	}
});
