import InternalUtils from "./lib/utils";

// import * as utils from "rus-anonym-utils";

// utils.array.clone

(async function () {
	console.log((await InternalUtils.MPT.parseReplacements())[0].groups);
})();
