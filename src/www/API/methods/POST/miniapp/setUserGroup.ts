import { RouteShorthandOptions } from "fastify/types/route";
import server from "../../../../../lib/server";
import InternalUtils from "../../../../../lib/utils";

interface Body {
	group: string;
	sign: string;
}

const opts: RouteShorthandOptions = {
	schema: {
		body: {
			group: { type: "string" },
			sign: { type: "string" },
		},
	},
};

const parseParams = (
	querystring: string,
): Record<string, string | string[]> => {
	const params = new URLSearchParams(querystring);
	const obj: Record<string, string | string[]> = {};
	for (const key of params.keys()) {
		if (params.getAll(key).length > 1) {
			obj[key] = params.getAll(key) || "";
		} else {
			obj[key] = params.get(key) || "";
		}
	}
	return obj;
};

server.post<{
	Body: Body;
}>("/api/miniapp.setUserGroup", opts, async (request) => {
	if (!InternalUtils.verifyLaunchParams(request.body.sign || "")) {
		throw new Error("Sign not specified or invalid");
	}

	if (!request.body.group) {
		throw new Error("Group not specified");
	}

	const groupName = request.body.group.toLowerCase();

	const groupData = InternalUtils.MPT.data.groups.find(
		(group) => group.name.toLowerCase() === groupName,
	);

	if (!groupData) {
		throw new Error("Group not found");
	}

	const signParams = parseParams(request.body.sign);

	const userData = await InternalUtils.VK_Bot_DB.models.user.findOne({
		id: Number(signParams.vk_user_id),
	});

	if (!userData) {
		throw new Error("User not found");
	}

	userData.group = groupData.name;
	await userData.save();

	return {
		response: 1,
	};
});
