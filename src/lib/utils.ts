import MPT from "./utils/mpt";
import DB from "./utils/DB";

import config from "../DB/config.json";

export default class Utils {
	public static MPT: MPT = new MPT();
	public static DB: DB = new DB({
		url: config.mongo.address,
		login: config.mongo.login,
		password: config.mongo.password,
		database: "API",
	});

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	private constructor() {}
}
