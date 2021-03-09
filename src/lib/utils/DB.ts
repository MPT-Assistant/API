import mongoose from "mongoose";

import * as schemes from "./DB/schemes";
import * as models from "./DB/models";

class DB {
	public static schemes = schemes;
	public static models = models;

	constructor({
		url,
		login,
		password,
		database,
	}: {
		url: string;
		login: string;
		password: string;
		database: string;
	}) {
		mongoose
			.connect(`mongodb+srv://${login}:${password}@${url}/${database}`, {
				useNewUrlParser: true,
				useUnifiedTopology: true,
			})
			.then(() => console.log(`MongoDB connected`));
	}
}

export default DB;
