import { RouteShorthandOptions } from "fastify/types/route";
import server from "../../../main";
import InternalUtils from "../../../../utils";

interface Body {
    uid: string;
}

const opts: RouteShorthandOptions = {
    schema: {
        body: {
            uid: { type: "string" },
        },
    },
    preValidation: (request, reply, done) => {
        const { uid } = request.body as Body;
        done(!uid || uid === "" ? new Error("Group ID not specified") : undefined);
    },
};

server.post<{
    Body: Body;
}>("/api/group.info", opts, async (request) => {
    const selectedID = request.body.uid;

    const findGroup = InternalUtils.MPT.data.groups.find(
        (group) => group.uid === selectedID,
    );

    if (!findGroup) {
        throw new Error("Group not found");
    } else {
        return {
            response: findGroup,
        };
    }
});
