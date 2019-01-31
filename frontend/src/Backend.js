import config from './config'
import Eos from 'eosjs'
import eosjs_ecc from 'eosjs-ecc'
// const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });
const contract = 'squeakrdappx'

import ScatterJS from 'scatterjs-core'
import ScatterEOS from 'scatterjs-plugin-eosjs'
import Priveos from 'priveos'
import nacl from 'tweetnacl'
import uuidv4 from 'uuid/v4'
const _ = require('underscore')
import Promise from 'bluebird'

ScatterJS.plugins( new ScatterEOS() )

class Backend {
  constructor() {
    // read-only EOS instance
    this.eos_api = Eos({
      httpEndpoint: config.httpEndpoint,
      chainId: config.chainId,
    })
  }
  async scatterConnect() {
    console.log("Ohai scatterConnect")
    if(this.scatter && this.eos) {
      console.log("Already set up, returning")
      return
    }
    const connected = await ScatterJS.scatter.connect("squeakr")
    // User does not have Scatter Desktop, Mobile or Classic installed.
    if(!connected) {
      console.error("Scatter not connected")
      return false
    }

    this.scatter = ScatterJS.scatter;
    window.ScatterJS = null;
    
    this.eos = this.scatter.eos(config.network, Eos)
    await this.scatter.login({accounts: [config.network]})
    this.account = this.scatter.identity.accounts.find(x => x.blockchain === 'eos')
    console.log("this.account: ", this.account)
  }
  
  async logout() {
    await this.scatter.logout()
    location.reload()
  }
  
  file_id() {
    return this.account.name
  }
  
  async users() {
    const res1 = await this.eos_api.getTableRows({
      json: true,
      code: contract,
      scope: contract,
      table: 'user',
      limit: 100,
    })
    console.log("rows: ", res1.rows)
    let users = _.indexBy(res1.rows, 'user')
    console.log("indexed users: ", JSON.stringify(users, null, 2))
    
    const res2 = await this.eos_api.getTableRows({
      json: true,
      code: contract,
      scope: contract,
      table: 'follower',
      limit: 100,
      table_key: this.account.name,
      index_position: 1,
      key_type: "name",
    })
    console.log("followees: ", res2.rows)
    for(const follower of res2.rows) {
      for(const user of res1.rows) {
        if(user.user == follower.follower) {
          console.log(`User ${user.user} already follows ${follower.followee}`)
          users[follower.followee].already_follows = true
        }
      }
    }
    
    const res3 = await this.eos_api.getTableRows({
      json: true,
      code: contract,
      scope: contract,
      table: 'request',
      limit: 100,
      table_key: this.account.name,
      index_position: 1,
      key_type: "name",
    })
    console.log("requested: ", res3.rows)
    for(const follower of res3.rows) {
      for(const user of res1.rows) {
        if(user.user == follower.follower) {
          console.log(`User ${user.user} already requested ${follower.followee}`)
          users[follower.followee].already_requested = true
        }
      }
    }
    console.log("indexed users: ", JSON.stringify(users, null, 2))
    console.log("Object.keys(users): ", Object.values(users))
    return Object.values(users)
  }
  
  async squeaks() {
    const res = await this.eos_api.getTableRows({
      json: true,
      code: contract,
      scope: contract,
      table: 'squeak',
      limit: 100,
    })
    console.log("rows: ", res.rows)
    let squeaks = res.rows
    if(this.account) {
      const {
        _,
        key,
        nonce
      } = await this.getOrCreateKeys()
      squeaks = res.rows.filter(x => x.uuid == this.file_id())
      for(let x of squeaks) {
        const y = nacl.secretbox.open(Priveos.hex_to_uint8array(x.secret), nonce, key)
        console.log("y: ", y)
        if(y) {
          x.secret = new TextDecoder("utf-8").decode(y)
        } else {
          x.secret = null
        }
      }
      
      const followers = await this.following()
      console.log("I'm following these people: ", followers)
      for(const { followee } of followers) {
        console.log("followee: ", followee)
        const tmp = getKey(followee)
        console.log("tmp: ", tmp)
        if(!tmp) {
          continue
        }
        const {key, nonce} = tmp
        console.log("key: ", key)
        console.log("nonce: ", typeof nonce)
        const followee_squeaks = res.rows.filter(x => x.uuid == followee)
        for(let x of followee_squeaks) {
          const y = nacl.secretbox.open(Priveos.hex_to_uint8array(x.secret), nonce, key)
          console.log("y: ", y)
          if(y) {
            x.secret = new TextDecoder("utf-8").decode(y)
          } else {
            x.secret = null
          }
        }
        console.log(`Squeaks by ${followee}: `, followee_squeaks)
        squeaks = squeaks.concat(followee_squeaks)
      }
    }
    
    
    
    // show most recent tweet at the top
    const sorted = squeaks.sort((a,b) => b.timestamp - a.timestamp)
    return sorted
  }
  
  async getOrCreateKeys(actions=[]) {
    console.log("ohai getOrCreateKeys")
    if(!localStorage.getItem(this.file_id())) {
      // 1. Generate Ephemeral Keys for secure communication
      config.priveos.eos = this.eos
      config.priveos.ephemeralKeyPrivate = await eosjs_ecc.randomKey()
      config.priveos.ephemeralKeyPublic = eosjs_ecc.privateToPublic(config.priveos.ephemeralKeyPrivate)
      
      // 2. Generate symmetric key that will be used to encrypt the tweets and register with privEOS      
      const priveos = new Priveos(config.priveos)
      let { key, nonce } = priveos.get_encryption_keys()
      
      const res = await priveos.store(this.account.name, this.account.name, key, nonce, "4,EOS", actions)
      
      key = Priveos.uint8array_to_hex(key)
      nonce = Priveos.uint8array_to_hex(nonce)
      console.log("setting key to: ", key)
      console.log("setting nonce to: ", nonce)
      console.log("localStorage.setItem this.file_id(): ", this.file_id())
      localStorage.setItem(this.file_id(), JSON.stringify({
        ephemeralKey,
        key,
        nonce,
      }))
    }
    
    let {
      ephemeralKey,
      key,
      nonce
    } = JSON.parse(localStorage.getItem(this.account.name))
    console.log("Key: ", key)
    key = Priveos.hex_to_uint8array(key)
    nonce = Priveos.hex_to_uint8array(nonce)
    return {
      ephemeralKey,
      key,
      nonce
    }
  }
  
  async getPriveos() {
    const {
      ephemeralKey,
      key,
      nonce
    } = await this.getOrCreateKeys()
    
    config.priveos.eos = this.eos
    config.priveos.ephemeralKeyPrivate = ephemeralKey.private
    config.priveos.ephemeralKeyPublic = ephemeralKey.public
    const priveos = new Priveos(config.priveos)
    return {priveos, nonce, key}
  }
  
  async post(text) {
    const {priveos, nonce, key} = await this.getPriveos()
    const secret = nacl.secretbox(Buffer.from(text), nonce, key)
    const file_id = this.account.name

    const actions = [{
      account: contract,
      name: 'post',
      authorization: [{
        actor: this.account.name,
        permission: this.account.authority,
      }],
      data: {
        user: this.account.name,
        secret: Priveos.uint8array_to_hex(secret),
        uuid: file_id,
      }
    }]
    const res = await this.eos.transaction({actions})
    console.log("res: ", JSON.stringify(res))
  }
  
  async accept(follower) {
    const actions = [{
      account: contract,
      name: 'accept',
      authorization: [{
        actor: this.account.name,
        permission: this.account.authority,
      }],
      data: {
        followee: this.account.name,
        follower: follower,
      }
    }]
    await this.eos.transaction({actions})
  }
  
  async following() {
    const res = await this.eos_api.getTableRows({
      json: true,
      code: contract,
      scope: contract,
      table: 'follower',
      limit: 100,
    })
    console.log("following: ", res.rows)
    return res.rows.filter(x => x.follower == this.account.name)
  }
  
  async followRequests() {
    const res = await this.eos_api.getTableRows({
      json: true,
      code: contract,
      scope: contract,
      table: 'request',
      limit: 100,
    })
    console.log("inside followRequests: res.rows: ", res.rows)
    return res.rows.filter(x => x.followee == this.account.name)
  }
  
  async followRequest(followee) {
    const actions = [{
      account: contract,
      name: 'followreq',
      authorization: [{
        actor: this.account.name,
        permission: this.account.authority,
      }],
      data: {
        follower: this.account.name,
        followee: followee,
      }
    }]
    const res = await this.eos.transaction({actions})
    console.log(res)
  }
  
  async requestAccess(user) {
    const { priveos } = await this.getPriveos()
    await priveos.accessgrant(this.account.name, user, "4,EOS")
    await Promise.delay(1000)
    const {key, nonce} = await priveos.read(this.account.name, user)
    addKey(user, key, nonce)
  }
}

/**
  * In a production application, it would be better to encrypt these.
  * Either with the user's private key or key derived from a username/password
  */
function addKey(user, key, nonce) {
  key = Priveos.uint8array_to_hex(key)
  nonce = Priveos.uint8array_to_hex(nonce)
  let keyStore = JSON.parse(localStorage.getItem('keystore') || '{}')
  keyStore[user] = {key, nonce}
  localStorage.setItem('keystore', JSON.stringify(keyStore))  
}

function getKey(user) {
  let keyStore = JSON.parse(localStorage.getItem('keystore') || '{}')
  const tmp = keyStore[user]
  if(!tmp) {
    return
  }
  let {key, nonce} = tmp
  key = Priveos.hex_to_uint8array(key)
  nonce = Priveos.hex_to_uint8array(nonce)
  return {key, nonce}
}

export default new Backend()
