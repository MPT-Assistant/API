import { configInterface, API, APIGetGroupSchedule } from "./types";
import fastify from "fastify";
import * as helmet from "fastify-helmet";
import mongoose from "mongoose";
import fs from "fs";
import qs from "querystring";
import crypto from "crypto";
import * as mongoData from "./mongo";

const config: configInterface = require(`./DB/config.json`);

const server = fastify({
	// https: {
	// 	key: fs.readFileSync(
	// 		"/etc/letsencrypt/live/mpt.rus-anonym.wtf/privkey.pem",
	// 	),
	// 	cert: fs.readFileSync(
	// 		"/etc/letsencrypt/live/mpt.rus-anonym.wtf/fullchain.pem",
	// 	),
	// },
});

server.register(helmet.fastifyHelmet);
server.register(require("fastify-cors"), {});

server.get(`/`, async (request, reply) => {
	return reply.send({ mpt: "shit" });
});

server.route<{ Querystring: API }>({
	method: ["GET", "POST"],
	url: "/api/getGroups",
	schema: {
		querystring: {
			token: {
				type: "string",
			},
		},
	},
	onError: (request, reply) => {
		return reply.send({
			error: {
				code: 0,
				message: "Internal server error",
			},
		});
	},
	onRequest: async function (request, reply, done) {
		if (!request.query.token) {
			return reply.send({
				error: {
					code: 0,
					message: "Invalid token",
				},
			});
		} else {
			let checkToken = await mongoData.user.findOne({
				"api.token": request.query.token,
			});
			if (!checkToken) {
				return reply.send({
					error: {
						code: 0,
						message: "Invalid token",
					},
				});
			} else {
				done();
			}
		}
	},
	handler: async function (request, reply) {
		let allGroups = await mongoData.utilityGroup.find();
		let outputData = allGroups.map((x) => {
			return {
				name: x.name,
				specialty: x.specialty,
				uid: x.uid,
			};
		});
		return reply.send({
			response: outputData,
		});
	},
});

server.route<{ Querystring: APIGetGroupSchedule }>({
	method: ["GET", "POST"],
	url: "/api/getGroupSchedule",
	schema: {
		querystring: {
			token: {
				type: "string",
			},
			id: {
				type: "string",
			},
		},
	},
	onError: (request, reply) => {
		return reply.send({
			error: {
				code: 0,
				message: "Internal server error",
			},
		});
	},
	onRequest: async function (request, reply, done) {
		if (!request.query.token) {
			return reply.send({
				error: {
					code: 0,
					message: "Invalid token",
				},
			});
		} else {
			let checkToken = await mongoData.user.findOne({
				"api.token": request.query.token,
			});
			if (!checkToken) {
				return reply.send({
					error: {
						code: 0,
						message: "Invalid token",
					},
				});
			} else {
				if (!request.query.id) {
					return reply.send({
						error: {
							code: 0,
							message: "Invalid group id",
						},
					});
				} else {
					done();
				}
			}
		}
	},
	handler: async function (request, reply) {
		let selectedGroup = await mongoData.utilityGroup.findOne({
			uid: request.query.id,
		});
		if (!selectedGroup) {
			return reply.send({
				error: {
					code: 0,
					message: "Invalid group id",
				},
			});
		}
		let groupSpecialty = await mongoData.specialty.findOne({
			uid: selectedGroup.specialty_id,
		});
		let groupSchedule = groupSpecialty?.groups?.find(
			(x) => x.uid === selectedGroup?.uid,
		);
		let outputData = groupSchedule?.weekly_schedule?.map((day) => {
			return {
				place: day.place,
				day_num: day.num,
				lessons: day.lessons?.map((lesson) => {
					return {
						num: lesson.num,
						name: lesson.name,
						teacher: lesson.teacher,
					};
				}),
			};
		});
		return reply.send({
			response: outputData,
		});
	},
});

server.route<{ Querystring: APIGetGroupSchedule }>({
	method: ["GET", "POST"],
	url: "/api/getGroupReplacements",
	schema: {
		querystring: {
			token: {
				type: "string",
			},
			id: {
				type: "string",
			},
		},
	},
	onError: (request, reply) => {
		return reply.send({
			error: {
				code: 0,
				message: "Internal server error",
			},
		});
	},
	onRequest: async function (request, reply, done) {
		if (!request.query.token) {
			return reply.send({
				error: {
					code: 0,
					message: "Invalid token",
				},
			});
		} else {
			let checkToken = await mongoData.user.findOne({
				"api.token": request.query.token,
			});
			if (!checkToken) {
				return reply.send({
					error: {
						code: 0,
						message: "Invalid token",
					},
				});
			} else {
				if (!request.query.id) {
					return reply.send({
						error: {
							code: 0,
							message: "Invalid group id",
						},
					});
				} else {
					done();
				}
			}
		}
	},
	handler: async function (request, reply) {
		let groupReplacements = await mongoData.replacement.find({
			unical_group_id: request.query.id,
			date: {
				$gt: "10.10.2020",
			},
		});
		let outputData = groupReplacements.map((element) => {
			return {
				date: element.date,
				lesson_num: element.lesson_num,
				old_lesson_name: element.old_lesson_name,
				old_lesson_teacher: element.old_lesson_teacher,
				new_lesson_name: element.new_lesson_name,
				new_lesson_teacher: element.new_lesson_teacher,
			};
		});
		return reply.send({
			response: outputData,
		});
	},
});

server.post("/MiniApp/getUserInfo", async (request, reply) => {
	if (!request.body) {
		return reply.send({ error: 1 });
	}
	//@ts-ignore
	if (internal.checkSignature(request.body.signature) === false) {
		return reply.send({ error: 2 });
	} else {
		//@ts-ignore
		let userData = await mongoData.user.findOne({ vk_id: request.body.vk_id });
		if (!userData) {
			return reply.send({
				error: 3,
			});
		} else {
			let userGroup = await mongoData.utilityGroup.findOne({
				//@ts-ignore
				uid: userData.data.unical_group_id,
			});
			if (userGroup) {
				return reply.send({
					user: {
						ban: userData.ban,
						nickname: userData.nickname,
						regData: userData.reg_date,
						lesson_notices: userData.data.lesson_notices,
						replacement_notices: userData.data.replacement_notices,
						mailing: userData.data.mailing,
					},
					group: userGroup.toJSON() || null,
				});
			} else {
				return reply.send({
					error: 3,
				});
			}
		}
	}
});

const internal = {
	checkSignature(signature: string) {
		const urlParams = qs.parse(signature);
		const ordered: any = {};
		Object.keys(urlParams)
			.sort()
			.forEach((key) => {
				if (key.slice(0, 3) === "vk_") {
					ordered[key] = urlParams[key];
				}
			});

		const stringParams = qs.stringify(ordered);
		const paramsHash = crypto
			.createHmac("sha256", config.secretKey)
			.update(stringParams)
			.digest()
			.toString("base64")
			.replace(/\+/g, "-")
			.replace(/\//g, "_")
			.replace(/=$/, "");

		return paramsHash === urlParams.sign;
	},
};

(async function scriptStart() {
	await mongoose.connect(config.mongoDB, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});
	server.listen(443, "0.0.0.0", (err, address) => {
		if (err) {
			console.error(err);
			process.exit(1);
		}
		console.log(`Server listening at ${address}`);
	});
})();
