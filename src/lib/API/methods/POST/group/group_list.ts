import server from "../../../main";
import InternalUtils from "../../../../utils";

server.post("/api/groups", async () => {
    return {
        response: InternalUtils.MPT.data.groups,
    };
});

server.post("/api/group.list", async () => {
    return {
        response: InternalUtils.MPT.data.groups,
    };
});
