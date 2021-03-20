import server from "../../../lib/server";
import InternalUtils from "../../../lib/utils";

import moment from "moment";

const getNumberOfWeek = () => {
	const today = new Date();
	const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
	const pastDaysOfYear =
		(today.valueOf() - firstDayOfYear.valueOf()) / 86400000;
	return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

server.post("/api/getCurrentWeek", async () => {
	return {
		response: {
			date: moment().format("DD.MM.YYYY"),
			week: InternalUtils.MPT.data.week,
			weekNum: getNumberOfWeek(),
		},
	};
});
