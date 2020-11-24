"use strict";
import { createSchema, Type, typedModel } from "ts-mongoose";

const userScheme = createSchema({
	id: Type.number(),
	vk_id: Type.number(),
	ban: Type.boolean(),
	reg_date: Type.date(),
	nickname: Type.string(),
	data: {
		unical_group_id: Type.string(),
		lesson_notices: Type.boolean(),
		replacement_notices: Type.boolean(),
		mailing: Type.boolean(),
	},
});

const lesson = createSchema({
	num: Type.number(),
	name: Type.array().of(Type.string()),
	teacher: Type.array().of(Type.string()),
});

const replacementScheme = createSchema({
	date: Type.string(),
	unical_group_id: Type.string(),
	detected: Type.date(),
	add_to_site: Type.date(),
	lesson_num: Type.number(),
	old_lesson_name: Type.string(),
	old_lesson_teacher: Type.string(),
	new_lesson_name: Type.string(),
	new_lesson_teacher: Type.string(),
});

const day = createSchema({
	num: Type.string(),
	place: Type.string(),
	lessons: Type.array().of(lesson),
});

const group = createSchema({
	id: Type.string(),
	uid: Type.string(),
	name: Type.string(),
	weekly_schedule: Type.array().of(day),
});

const specialtyScheme = createSchema({
	uid: Type.string(),
	name: Type.string(),
	groups: Type.array().of(group),
});

const utilityGroupScheme = createSchema({
	uid: Type.string(),
	name: Type.string(),
	id: Type.string(),
	specialty: Type.string(),
	specialty_id: Type.string(),
});

const user = typedModel("user", userScheme, `users`);
const specialty = typedModel("specialty", specialtyScheme, `specialties`);
const replacement = typedModel(
	"replacement",
	replacementScheme,
	`replacements`,
);
const utilityGroup = typedModel("utility_group", utilityGroupScheme, `groups`);

export = {
	user,
	specialty,
	replacement,
	utilityGroup,
};
