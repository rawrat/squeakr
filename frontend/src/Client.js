const Eos = require('eosjs')
const eosjs_ecc = require('eosjs-ecc')
const axios = require('axios')
const Priveos = require('priveos')
const assert = require('assert')

const url = 'http://localhost:5432'

class Client {
  userreg(username, public_key) {
    axios.post(url + '/userreg', {
      username,
      public_key,
    })
  }
}

export default new Client()