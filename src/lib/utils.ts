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

	public static VK_Bot_DB = new VK_Bot_DB({
		url: config.mongo.address,
		login: config.mongo.login,
		password: config.mongo.password,
		database: "vk",
	});

	public static verifyLaunchParams(query: string): boolean {
		let sign;
		const hashQueryParams: {
			key: string;
			value: string;
		}[] = [];

		const processQueryParam = (key: string, value: string) => {
			if (typeof value === "string") {
				if (key === "sign") {
					sign = value;
				} else if (key.startsWith("vk_")) {
					hashQueryParams.push({ key, value });
				}
			}
		};

		const formattedQuery = query.startsWith("?") ? query.slice(1) : query;

		for (const param of formattedQuery.split("&")) {
			const [key, value] = param.split("=");
			processQueryParam(key, value);
		}

		if (!sign || hashQueryParams.length === 0) {
			return false;
		}

		const queryString = hashQueryParams
			.sort((a, b) => a.key.localeCompare(b.key))
			.reduce((acc, { key, value }, idx) => {
				return (
					acc + (idx === 0 ? "" : "&") + `${key}=${encodeURIComponent(value)}`
				);
			}, "");

		const paramsHash = CryptoJS.HmacSHA256(queryString, config.vk.secretKey)
			.toString(CryptoJS.enc.Base64)
			.replace(/\+/g, "-")
			.replace(/\//g, "_")
			.replace(/=$/, "");

		return paramsHash === sign;
	}

	private constructor() {
		return this;
	}
}
