import server from "../../main";
import InternalUtils from "../../../lib/utils";
import moment from "moment";

server.post("/api/getReplacements", async () => {
    return {
        response: InternalUtils.MPT.data.replacements.map((replacement) => {
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