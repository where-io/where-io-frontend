const BASE_URL = process.env.REACT_APP_API_URL;

export class TagService {
  static getAll() {
    return fetch(`${BASE_URL}/api/tag/all`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
