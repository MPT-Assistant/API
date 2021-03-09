import "./API/main";
import InternalUtils from "./utils";
import server from "./API/main";
import "./API/loader";
import { Interval } from "simple-scheduler-task";

InternalUtils.MPT.updateData();

new Interval(async () => await InternalUtils.MPT.updateData(), 5 * 60 * 1000);

server.listen(443, "0.0.0.0", (err, address) => {
	if (err) {
		console.error(err);
	}
	console.log(`Server listening at ${address}`);
});
