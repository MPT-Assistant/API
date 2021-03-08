import API from "../API";
import InternalUtils from "../../utils";

import moment from "moment";

function getNumberOfWeek() {
	const today = new Date();
	const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
	const pastDaysOfYear =
		(today.valueOf() - firstDayOfYear.valueOf()) / 86400000;
	return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

API.push({
	method: "POST",
	url: "/api/getCurrentWeek",
	handler: async () => {
		return {
			date: moment().format("DD.MM.YYYY"),
			week: InternalUtils.MPT.data.week,
			weekNum: getNumberOfWeek(),
		};
	},
});