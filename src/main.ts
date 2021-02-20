import * as utils from "./lib/utils";

(async function () {
	console.log((await utils.mpt.parseLessons())[0].groups[0].days[0].lessons);
})();
