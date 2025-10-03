import api from './api'

export const adminApi = {
  // User management
  async getUsers() {
    const response = await api.get('/api/admin/users')
    return response.data
  },

  async getUserDetails(id) {
    const response = await api.get(`/api/admin/users/${id}`)
    return response.data
  },

  async updateUser(id, data) {
    const response = await api.put(`/api/admin/users/${id}`, data)
    return response.data
  },

  async deleteUser(id) {
    const response = await api.delete(`/api/admin/users/${id}`)
    return response.data
  },

  // Statistics
  async getStatistics() {
    const response = await api.get('/api/admin/statistics')
    return response.data
  },

  async getUserActivity(id) {
    const response = await api.get(`/api/admin/user-activity/${id}`)
    return response.data
  },

  // Media management
  async getAllMediaItems(params = {}) {
    const response = await api.get('/api/admin/media-items', { params })
    return response.data
  },

  async getAllCollections() {
    const response = await api.get('/api/admin/collections')
    return response.data
  }
}

export default adminApi

