import { RouteShorthandOptions } from "fastify/types/route";
import server from "../../main";
import InternalUtils from "../../../utils";
import * as utils from "rus-anonym-utils";

interface Body {
    specialtyID: string;
}

const opts: RouteShorthandOptions = {
    schema: {
        body: {
            specialtyID: { type: "string" },
        },
    },
    preValidation: (request, reply, done) => {
        const { specialtyID } = request.body as Body;
        done(!specialtyID || specialtyID === "" ? new Error("Group not specified") : undefined);
    },
};

server.post<{
    Body: Body;
}>("/api/specialty.get", opts, async (request) => {
    const selectedGroup = request.body.specialtyID;

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
