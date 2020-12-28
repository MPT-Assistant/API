export interface configInterface {
	secretKey: string;
	mongoDB: string;
}

export interface API {
	token: string;
}

export interface APIGetGroupSchedule extends API {
	id: string;
}
