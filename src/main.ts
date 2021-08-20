import internalUtils from "./lib/utils";

(async function () {
	console.log(await internalUtils.mpt.parser.getCurrentWeek());
})();
