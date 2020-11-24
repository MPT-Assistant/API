import { configInterface } from "./types";
import fastify from "fastify";
import * as helmet from "fastify-helmet";
import mongoose from "mongoose";
import fs from "fs";
import qs from "querystring";
import crypto from "crypto";

const server = fastify({
	http2: true,
	https: {
		key: fs.readFileSync(
			"/etc/letsencrypt/live/mpt.rus-anonym.wtf/privkey.pem",
		),
		cert: fs.readFileSync(
			"/etc/letsencrypt/live/mpt.rus-anonym.wtf/fullchain.pem",
		),
	},
});

server.register(helmet.fastifyHelmet);

const config: configInterface = require(`./DB/config.json`);

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

server.register(require("fastify-cors"), {});

server.addHook("preHandler", async (request, reply, next) => {
	//@ts-ignore
	if (!request.body || !req.body.signature) {
		return;
	} else {
		//@ts-ignore
		if (internal.checkSignature(request.body.signature) === false) {
			return;
		} else {
			next();
		}
	}
});

server.post("/getUserInfo", async (request, reply) => {
	//@ts-ignore
});

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
