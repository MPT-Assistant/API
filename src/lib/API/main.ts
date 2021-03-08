import Fastify, { FastifyInstance } from "fastify";
import httpsRedirect from "fastify-https-redirect";
import fs from "fs";

import routes from "./API";

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

routes.map((route) => {
	server.route(route);
});

server.get("/", async () => {
	return {
		hello: "world",
	};
});

server.listen(443, "0.0.0.0", (err, address) => {
	if (err) {
		console.error(err);
	}
	console.log(`Server listening at ${address}`);
});

export default server;
