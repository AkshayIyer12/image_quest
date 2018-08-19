const request = require('supertest')
const { httpServer } = require('../lib/index')
const fs = require('fs')
const { promisify } = require('util')
describe('Image API tests' , () => {
  describe('GET /createAccesskey', () => {
    it('respond with json and status 200 OK', () => {
      return new Promise((resolve, reject) => {
        request(httpServer)
          .get('/createAccessKey')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .then(({ body }) => resolve(body))
          .catch(err => reject(err))
      })
    })
  })
  after(() => httpServer.close(() => process.exit()))
})
