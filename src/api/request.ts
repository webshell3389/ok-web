import axios from 'axios'
import qs from 'qs'

const request = axios.create({
  baseURL: '/service/',
  withCredentials: true,
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  transformRequest: [(data) => {
    if (data && typeof data === 'object' && !(data instanceof URLSearchParams) && !(data instanceof FormData)) {
      return qs.stringify(data)
    }
    return data
  }],
})

request.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      window.location.href = '/merchant/login'
    }
    return Promise.reject(err)
  },
)

export default request
