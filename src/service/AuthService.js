import axios from "axios";

class AuthService {
  constructor() {
    this.baseURL = " http://43.224.116.185:8007"; // <- change to your backend
    this.axios = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
    });
  }

  /**
   * Login with email and password
   * @param {Object} payload { email, password }
   * @returns {Promise<{token: string, user: Object}>}
   */
  async login(payload) {
    try {
      const url = "/api/v2/a/login"; // your backend endpoint
      const res = await this.axios.post(url, payload);

      // Example backend response: { token: "...", user: { ... } }
      return res.data;
    } catch (err) {
      // Handle error
      throw new Error(err.response?.data?.message || "Invalid credentials!");
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      const url = "/api/v2/a/logout"; // if backend supports
      await this.axios.post(url);
      localStorage.removeItem("token");
    } catch (err) {
      console.error("Logout failed", err);
      localStorage.removeItem("token");
    }
  }

  /**
   * Get current user profile
   */
  async profile() {
    try {
      const token = localStorage.getItem("token");
      const res = await this.axios.get("/api/v2/a/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch (err) {
      throw new Error("Failed to fetch profile");
    }
  }
}

export default new AuthService();
