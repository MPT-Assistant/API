import { RouteShorthandOptions } from "fastify/types/route";
import server from "../../main";

interface IQuery {
	id: string;
	from?: number;
	to?: number;
}

const opts: RouteShorthandOptions = {
	schema: {
		querystring: {
			id: { type: "string" },
			from: { type: "number" },
			to: { type: "number" },
		},
	},
	preValidation: (request, reply, done) => {
		const {
			id,
			from = new Date().valueOf(),
			to = new Date().valueOf() + 24 * 60 * 60 * 1000,
		} = request.query as IQuery;
		if (!id) {
			new Error("Group ID not specified");
		}
		try {
			new Date(from);
			new Date(to);
		} catch (error) {
			new Error("One of the time parameters is invalid");
		}
		done();
	},
};

server.post<{
	Querystring: IQuery;
}>("/api/getGroupReplacements", opts, async () => {
	return {
		response: {},
	};
});
