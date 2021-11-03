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

	async getProjectChallenges(projectId : string) : Promise<any> {
		const projectChallengesResponse = await request({
			method: 'GET',
			url: `${NANOWRIMO_API_URL}/projects/${projectId}/project-challenges`,
			headers: {
				"Content-Type": "application/json",
				"Authorization": this.token,
			},
		})

		return JSON.parse(projectChallengesResponse)
	}

	async updateProject(projectId : string, projectChallengeId: string, sprintCount : number) : Promise<any> {
		const data : any = {
			data: {
				relationships: {
					project: {
						data: {
							type: "projects",
							"id": projectId,
						}
					},
					"project-challenge": {
						data: {
							type: "project-challenges",
							id: projectChallengeId,
						}
					}
				},
				type: "project-sessions",
				attributes: {
					how: null,
					start: null,
					feeling: null,
					"unit-type": 0,
					where: null,
					"project-id": Number(projectId),
					"created-at": null,
					"project-challenge-id": Number(projectChallengeId),
					count: sprintCount,
					end: null,
				}
			}
		}

		console.log(JSON.stringify(data))
		const result = await request({
			method: 'POST',
			url: `${NANOWRIMO_API_URL}/project-sessions`,
			headers: {
				"Content-Type": "application/vnd.api+json",
				"Authorization": this.token,
			},
			body: JSON.stringify(data)
		})

		const resultObj : any = JSON.parse(result)
		return resultObj
	}
}
