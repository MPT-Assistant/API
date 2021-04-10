import MPT from "./utils/mpt";
import { API_DB, VK_Bot_DB } from "./utils/DB";

import config from "../DB/config.json";

export default class Utils {
	public static MPT: MPT = new MPT();
	public static API_DB: API_DB = new API_DB({
		url: config.mongo.address,
		login: config.mongo.login,
		password: config.mongo.password,
		database: "API",
	});

	public VK_Bot_DB = new VK_Bot_DB({
		url: config.mongo.address,
		login: config.mongo.login,
		password: config.mongo.password,
		database: "vk",
	});

	private constructor() {
		return this;
	}
}
