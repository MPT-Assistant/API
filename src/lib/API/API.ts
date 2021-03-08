import {
	ContextConfigDefault,
	RawReplyDefaultExpression,
	RawRequestDefaultExpression,
	RawServerBase,
} from "fastify";

import { RouteGenericInterface, RouteOptions } from "fastify/types/route";

const routes: Array<
	RouteOptions<
		RawServerBase,
		RawRequestDefaultExpression,
		RawReplyDefaultExpression,
		RouteGenericInterface,
		ContextConfigDefault
	>
> = [];

export default routes;

import "./methods/getCurrentWeek";
import "./methods/getGroupList";
