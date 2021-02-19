import axios from "axios";
import cheerio from "cheerio";

async function parseLessons() {
	const LessonsHTML = (
		await axios.get("https://www.mpt.ru/studentu/raspisanie-zanyatiy/")
	).data;
	const $ = cheerio.load(LessonsHTML);
	const ArrayWithAllFlow = $(
		`body > div.page > main > div > div > div:nth-child(3) > div.col-xs-12.col-sm-12.col-md-7.col-md-pull-5 > div.tab-content`,
	);

	const SpecialtyList = [];
	ArrayWithAllFlow.children().each(async function (
		_specialtyIndex,
		specialtyElement,
	) {
		const SelectedSpecialty = $(specialtyElement).children();
		const Specialty: string = ((SelectedSpecialty[0].children[0] as any)
			.data as string).replace("Расписание занятий для ", "");
		const SpecialtyID = $(specialtyElement).attr("id");

		$(SelectedSpecialty[1])
			.children()
			.each(async function (_groupIndex, groupElement) {
				const SelectedGroup = $($(groupElement).children()[0]);
				const GroupID = SelectedGroup.attr("aria-controls");
			});
	});
	// return ArrayWithAllFlow;
}

async function parseReplacements() {}

export { parseLessons, parseReplacements };
