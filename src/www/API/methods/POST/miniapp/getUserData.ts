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
			sign: { type: "string" },
		},
	},
};

server.post<{
	Body: Body;
}>("/api/miniapp.getUserData", opts, async (request) => {
	if (!InternalUtils.verifyLaunchParams(request.body.sign || "")) {
		throw new Error("Sign not specified or invalid");
	}

	if (!request.body.id || Number(request.body.id) <= 0) {
		throw new Error("ID not specified");
	}

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

	return {
		response: selectedUsers.map((user) => {
			return {
				id: user.id,
				group: user.group,
				reg_date: user.reg_date,
			};
		})
	}
});
