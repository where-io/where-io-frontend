const BASE_URL = process.env.REACT_APP_API_URL
console.log("URL:" + BASE_URL)

export class LocaisService {

    static getAll() {
        return fetch(`${BASE_URL}/api/local/all`,
        {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                }
            }
        )
    }

    static async create(payload) {

        return fetch(`${BASE_URL}/api/local`,
        {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            }
        )
    }

    static async update(id, payload) {

    }

    static async delete(id) {

    }
}