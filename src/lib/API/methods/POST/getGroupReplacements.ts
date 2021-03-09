import { RouteShorthandOptions } from "fastify/types/route";
import server from "../../main";

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
}>("/api/getGroupReplacements", opts, async () => {
	return {
		response: {},
	};
});
