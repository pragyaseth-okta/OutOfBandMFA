import Vue from 'vue'
import axios from 'axios'

const client = axios.create({
  baseURL: 'http://localhost:8081/',
  json: true
})

export default {
  async execute (method, resource, data) {
    // inject the accessToken for each request
    let accessToken = await Vue.prototype.$auth.getAccessToken()
    return client({
      method,
      url: resource,
      data,
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }).then(req => {
      return req.data
    })
  },
  async searchUser (data) {
    const url = '/searchUser/' + data.employeeID
    var response = await this.execute('get', url)
    return response
  },
  async validateOTP (userID, data, factorID) {
    const url = userID + '/factors/' + factorID + '/verify'
    var response = await this.execute('post', url, data)
    return response
  },
  async validatePush (data) {
    const url = '/validatePush'
    var response = await this.execute('post', url, data)
    return response
  }
}
