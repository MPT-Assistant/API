import { RouteShorthandOptions } from "fastify/types/route";
import server from "../../main";

interface IQuery {
	id: string;
	from?: number | Date;
	to?: number | Date;
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
		const { id } = request.query as IQuery;
		let {
			from = new Date().valueOf(),
			to = new Date().valueOf() + 24 * 60 * 60 * 1000,
		} = request.query as IQuery;
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
