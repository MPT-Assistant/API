import DB from "./DB";
import MPT from "./MPT";

class Utils {
	public readonly MPT = new MPT();
	public readonly DB = new DB();
}

export default new Utils();
