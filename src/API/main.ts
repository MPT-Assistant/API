import Fastify, { FastifyInstance } from "fastify";
import httpsRedirect from "fastify-https-redirect";
import fastifyFormBody from "fastify-formbody";
import fastifyMultiPart from "fastify-multipart";
import fastifyCors from "fastify-cors";
import fs from "fs";

const server: FastifyInstance = Fastify({
	https: {
		key: fs.readFileSync(
			"/etc/letsencrypt/live/mpt.rus-anonym.wtf/privkey.pem",
		),
		cert: fs.readFileSync(
			"/etc/letsencrypt/live/mpt.rus-anonym.wtf/fullchain.pem",
		),
	},
});

server.register(httpsRedirect);
server.register(fastifyFormBody);
server.register(fastifyMultiPart);
server.register(fastifyCors, { origin: "*" });

export default server;
