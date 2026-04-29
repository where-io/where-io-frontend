const BASE_URL = process.env.REACT_APP_API_URL

export class VisitaService{

    static async create(payload) {
        return await fetch(`${BASE_URL}/api/visita`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });
    }

    static async getById(localId) {
        return await fetch(`${BASE_URL}/api/visita/${localId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            }
        });
    }

}