import server from "../../main";
import InternalUtils from "../../../utils";

server.post("/api/getGroupList", async () => {
	return {
		response: InternalUtils.MPT.data.groups,
	};
});
