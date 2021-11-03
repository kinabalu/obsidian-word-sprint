import {request} from "obsidian";

const NANOWRIMO_API_URL = 'https://api.nanowrimo.org'

export default class NanowrimoApi {
	token!: string

	constructor(token: string) {
		this.token = token
	}

	static async login(username: string, password: string): Promise<any> {
		const data = await request({
			method: 'POST',
			url: `${NANOWRIMO_API_URL}/users/sign_in`,
			headers: {"Content-Type": "application/json"},
			body: `{"identifier": "${username}", "password": "${password}"}`
		})

		return JSON.parse(data)['auth_token']
	}

	async getUser(username : string): Promise<any> {
		const userData = await request({
			method: 'GET',
			url: `${NANOWRIMO_API_URL}/users/${username}`,
			headers: {
				"Content-Type": "application/json",
				"Authorization": this.token,
			},
		})

		return JSON.parse(userData)
	}

	async getProjects(userId : string) : Promise<any> {
		const projectsResponse = await request({
			method: 'GET',
			url: `${NANOWRIMO_API_URL}/projects?filter[user_id]=${userId}`,
			headers: {
				"Content-Type": "application/json",
				"Authorization": this.token,
			},
		})

		return JSON.parse(projectsResponse)
	}

}
