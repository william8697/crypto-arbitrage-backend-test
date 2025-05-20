// public/js/api.js
class API {
  constructor() {
    this.baseUrl = FRONTEND_URL;
    this.auth = auth;
  }

  async request(endpoint, method = 'GET', body = null, requiresAuth = true) {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (requiresAuth) {
      if (!this.auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
      }
      Object.assign(headers, this.auth.getAuthHeader());
    }

    const options = {
      method,
      headers
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, options);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          this.auth.logout();
        }
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (err) {
      console.error('API request error:', err);
      throw err;
    }
  }

  // User methods
  async register(userData) {
    return this.request('/api/auth/register', 'POST', userData, false);
  }

  async getProfile() {
    return this.request('/api/users/me');
  }

  async updateProfile(profileData) {
    return this.request('/api/users/update', 'PATCH', profileData);
  }

  // Trade methods
  async executeTrade(pair, amount) {
    return this.request('/api/trades/execute', 'POST', { pair, amount });
  }

  async getTrades() {
    return this.request('/api/trades');
  }

  // Support methods
  async createSupportTicket(subject, message) {
    return this.request('/api/support', 'POST', { subject, message });
  }

  async getMyTickets() {
    return this.request('/api/support/my-tickets');
  }
}

const api = new API();