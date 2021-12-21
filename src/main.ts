import internalUtils from "./lib/utils";

(async function () {
	internalUtils.DB.connection.once("open", async () => {
		await internalUtils.MPT.updateReplacementsList();
		console.log(`Executed`);
	});
})();
