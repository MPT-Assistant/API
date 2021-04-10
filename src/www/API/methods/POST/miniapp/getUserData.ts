// import { RouteShorthandOptions } from "fastify/types/route";
// import server from "../../../../../lib/server";
// import InternalUtils from "../../../../../lib/utils";

// interface Body {
// 	id: number | number[];
// }

// const opts: RouteShorthandOptions = {
// 	schema: {
// 		body: {
// 			id: { type: "string" },
// 		},
// 	},
// 	preValidation: (request, reply, done) => {
// 		const { id } = request.body as Body;
// 		done(!id || id <= 0 ? new Error("ID not specified") : undefined);
// 	},
// };

// server.post<{
// 	Body: Body;
// }>("/api/miniapp.getUserdata", opts, async (request) => {});
