import { RouteShorthandOptions } from "fastify/types/route";
import server from "../../../../../lib/server";
import InternalUtils from "../../../../../lib/utils";

interface Body {
	id: number | number[];
	sign: string;
}

const opts: RouteShorthandOptions = {
	schema: {
		body: {
			id: { type: "string" },
			sign: { type: "string" },
		},
	},
	preValidation: (request, reply, done) => {
		const { id, sign } = request.body as Body;
		if (!sign || InternalUtils.verifyLaunchParams(sign)) {
			new Error("Sign not specified or invalid");
		}
		if (!id || id <= 0) {
			new Error("ID not specified");
		}
		done();
	},
};

server.post<{
	Body: Body;
}>("/api/miniapp.getUserdata", opts, async (request) => {
	if (typeof request.body.id === "number") {
		request.body.id = [request.body.id];
	}
	if (request.body.id.length > 50) {
		throw new Error("To many users");
	}

	const selectedUsers = await InternalUtils.VK_Bot_DB.models.user.find({
		id: {
			$in: request.body.id.map((x) => Number(x)),
		},
	});

	return selectedUsers.map((user) => {
		return {
			id: user.id,
			group: user.group,
			reg_date: user.reg_date,
		};
	});
});
