import { RouteShorthandOptions } from "fastify/types/route";
import server from "../../../main";
import InternalUtils from "../../../../lib/utils";
import moment from "moment";

interface Body {
    name: string;
}

const opts: RouteShorthandOptions = {
    schema: {
        body: {
            name: { type: "string" },
        },
    },
    preValidation: (request, reply, done) => {
        const { name } = request.body as Body;
        done(!name || name === "" ? new Error("Group name not specified") : undefined);
    },
};

server.post<{
    Body: Body;
}>("/api/group.getReplacements", opts, async (request) => {
    const groupName = request.body.name;

    if (!InternalUtils.MPT.data.groups.find((group) => group.name === groupName)) {
        throw new Error("Group not found");
    }

    return {
        response: InternalUtils.MPT.data.replacements.filter(replacement => replacement.group.toLowerCase() === groupName.toLowerCase()).map((replacement) => {
            return {
                date: moment(replacement.date).format("DD.MM.YYYY"),
                name: replacement.group,
                detected: replacement.detected,
                addToSite: replacement.addToSite,
                lessonNum: replacement.lessonNum,
                oldLessonName: replacement.oldLessonName,
                oldLessonTeacher: replacement.oldLessonTeacher,
                newLessonName: replacement.newLessonName,
                newLessonTeacher: replacement.newLessonTeacher,
            };
        }),
    };
});