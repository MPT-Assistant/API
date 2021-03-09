import { RouteShorthandOptions } from "fastify/types/route";
import server from "../../main";
import InternalUtils from "../../../utils";
import * as utils from "rus-anonym-utils";

interface IQuery {
	group: string;
}

const opts: RouteShorthandOptions = {
	schema: {
		querystring: {
			group: { type: "string" },
		},
	},
	preValidation: (request, reply, done) => {
		const { group } = request.query as IQuery;
		done(!group || group === "" ? new Error("Group not specified") : undefined);
	},
};

server.post<{
	Querystring: IQuery;
}>("/api/getGroupID", opts, async (request) => {
	const selectedGroup = request.query.group;

	const findGroup =
		InternalUtils.MPT.data.groups.find(
			(group) => group.name.toUpperCase() === selectedGroup.toUpperCase(),
		) || null;

	const diff: Array<{ name: string; diff: number }> = [];
	for (const tempGroup of InternalUtils.MPT.data.groups) {
		diff.push({
			name: tempGroup.name,
			diff: utils.string.levenshtein(
				selectedGroup.toUpperCase(),
				tempGroup.name.toUpperCase(),
			),
		});
	}
	diff.sort(function (a, b) {
		if (a.diff > b.diff) {
			return 1;
		}
		if (a.diff < b.diff) {
			return -1;
		}
		return 0;
	});
	diff.splice(3);

	return {
		response: {
			id: findGroup?.uid,
			name: findGroup?.name,
			perhaps: diff.map((group) => group.name),
		},
	};
});
