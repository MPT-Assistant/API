import server from "../../../../../lib/server";
import InternalUtils from "../../../../../lib/utils";

server.post("/api/getCurrentWeek", async () => {
	return {
		response: InternalUtils.MPT.data.timetable,
	};
});
