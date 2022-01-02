import mongoose from "mongoose";

import config from "../../../DB/config.json";

import timetable from "./timetable";
import schemes from "./schemes";
import { typedModel } from "ts-mongoose";

class DB {
	public readonly connection = mongoose.createConnection(
		`${config.db.protocol}://${config.db.login}:${config.db.password}@${config.db.address}/API`,
		{
			autoCreate: true,
			autoIndex: true,
		},
	);

	public readonly timetable = timetable;
	public readonly schemes = schemes;
	public readonly models = {
		specialty: typedModel(
			"specialty",
			schemes.specialtySchema,
			"specialties",
			undefined,
			undefined,
			this.connection,
		),
		group: typedModel(
			"group",
			schemes.groupSchema,
			"groups",
			undefined,
			undefined,
			this.connection,
		),
		replacement: typedModel(
			"replacement",
			schemes.replacementSchema,
			"replacements",
			undefined,
			undefined,
			this.connection,
		),
		info: typedModel(
			"info",
			schemes.infoSchema,
			"info",
			undefined,
			undefined,
			this.connection,
		),
	};
}

export default DB;
