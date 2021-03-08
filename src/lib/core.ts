import "./API/main";
import InternalUtils from "./utils";
import { Interval } from "simple-scheduler-task";

InternalUtils.MPT.updateData();

new Interval(async () => await InternalUtils.MPT.updateData(), 5 * 60 * 1000);
