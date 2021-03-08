import API from "../API";
import InternalUtils from "../../utils";

API.push({
	method: "POST",
	url: "/api/getGroupList",
	handler: async () => {
		return {
			response: InternalUtils.MPT.data.groups,
		};
	},
});
