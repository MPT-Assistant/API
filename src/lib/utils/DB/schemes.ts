import { createSchema, Type } from "ts-mongoose";

const UtilityGroupSchema = createSchema({
	uid: Type.string({ required: true, unique: true }),
	id: Type.string({ required: true }),
	name: Type.string({ required: true }),
	specialty: Type.string({ required: true }),
	specialtyID: Type.string({ required: true }),
});

const LessonScheme = createSchema({
	num: Type.number({ required: true }),
	name: Type.array({ required: true }).of(Type.string({ required: true })),
	teacher: Type.array({ required: true }).of(Type.string({ required: true })),
});

const DaySchema = createSchema({
	num: Type.string({ required: true }),
	place: Type.string({ required: true }),
	lessons: Type.array({ required: true }).of(LessonScheme),
});

const GroupSchema = createSchema({
	uid: Type.string({ required: true, unique: true }),
	id: Type.string({ required: true }),
	schedule: Type.array({ required: true }).of(DaySchema),
});

const SpecialtySchema = createSchema({
	id: Type.string({ required: true, unique: true }),
	name: Type.string({ required: true }),
	groupsCount: Type.number({ required: true }),
});

const ReplacementSchema = createSchema({
	date: Type.date({ required: true }),
	uid: Type.string({ required: true }),
	detected: Type.date({ required: true }),
	addToSite: Type.date({ required: true }),
	lessonNum: Type.number({ required: true }),
	oldLessonName: Type.string({ required: true }),
	oldLessonTeacher: Type.string({ required: true }),
	newLessonName: Type.string({ required: true }),
	newLessonTeacher: Type.string({ required: true }),
});

export { UtilityGroupSchema, GroupSchema, SpecialtySchema, ReplacementSchema };
