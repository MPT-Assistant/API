import path from "path";
import fastifyStatic from "fastify-static";

import server from "../lib/server";

import "./API/methods/POST/getCurrentWeek";

import "./API/methods/POST/group/get";
import "./API/methods/POST/group/getList";

import "./API/methods/POST/replacements/get";

import "./API/methods/POST/schedule/get";

server.register(fastifyStatic, {
	root: path.join(__dirname, "./front"),
});
