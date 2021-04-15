import server from "../../../../lib/server";
import InternalUtils from "../../../../lib/utils";

import moment from "moment";

server.post("/api/getCurrentWeek", async () => {
	return {
		response: {
			date: moment().format("DD.MM.YYYY"),
			week: InternalUtils.MPT.data.week,
			weekNum: moment().week(),
		},
	};
});
