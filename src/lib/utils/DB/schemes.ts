import { createSchema, Type } from "ts-mongoose";

const UtilityGroupSchema = createSchema({
	uid: Type.string({ required: true }),
	id: Type.string({ required: true }),
	name: Type.string({ required: true }),
	specialty: Type.string({ required: true }),
	specialtyID: Type.string({ required: true }),
});

export { UtilityGroupSchema };
