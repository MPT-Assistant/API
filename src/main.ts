import internalUtils from "./lib/utils";

(async function () {
	internalUtils.DB.connection.once("open", async () => {
		setInterval(() => {
			internalUtils.MPT.updateGroupsList();
			internalUtils.MPT.updateReplacementsList();
			internalUtils.MPT.updateInfo();
		}, 5 * 60 * 1000);
	});
})();
