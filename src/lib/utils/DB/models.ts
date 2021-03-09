import * as schemes from "./schemes";
import { typedModel } from "ts-mongoose";

export const utilityGroupModel = typedModel(
	"utilityGroup",
	schemes.UtilityGroupSchema,
	"utilityGroups",
);

export const groupModel = typedModel("group", schemes.GroupSchema, "groups");

export const specialtyModel = typedModel(
	"specialty",
	schemes.SpecialtySchema,
	"specialties",
);

export const replacementModel = typedModel(
	"replacement",
	schemes.ReplacementSchema,
	"replacements",
);

