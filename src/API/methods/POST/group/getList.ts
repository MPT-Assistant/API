import server from "../../../../lib/server";
import InternalUtils from "../../../../lib/utils";

server.post("/api/group.getList", async () => {
	return {
		response: InternalUtils.MPT.data.groups,
	};
});
