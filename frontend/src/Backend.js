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
    this.scatter.logout()
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
    const users = res1.rows.map(x => x.user)
    
    const res2 = await this.eos_api.getTableRows({
      json: true,
      code: contract,
      scope: contract,
      table: 'follower',
      limit: 100,
      table_key: "byfollowee",
      // index_position: 3,
      key_type: "name",
      lower_bound: this.account.name,
    })
    console.log("followers: ", res2.rows)

    return users
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
    }
    
    // show most recent tweet at the top
    const sorted = squeaks.sort((a,b) => b.timestamp - a.timestamp)
    return sorted
  }
  
  async getOrCreateKeys(actions=[]) {
    console.log("ohai getOrCreateKeys")
    if(!localStorage.getItem(this.file_id())) {
      // 1. Generate Ephemeral Keys for secure communication
      const privateKey = await eosjs_ecc.randomKey()
      const publicKey = eosjs_ecc.privateToPublic(privateKey)
      const ephemeralKey = {"private": privateKey, "public": publicKey}
      console.log("Generate ephemeralKey: ", ephemeralKey)
      // 2. Generate symmetric key that will be used to encrypt the tweets and register with privEOS
      config.priveos.eos = this.eos
      config.priveos.ephemeralKeyPrivate = ephemeralKey.private
      config.priveos.ephemeralKeyPublic = ephemeralKey.public
      
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
  
  async post(text) {
    const {
      ephemeralKey,
      key,
      nonce
    } = await this.getOrCreateKeys()
    
    config.priveos.eos = this.eos
    config.priveos.ephemeralKeyPrivate = ephemeralKey.private
    config.priveos.ephemeralKeyPublic = ephemeralKey.public
    
    const priveos = new Priveos(config.priveos)
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
  
  async following(user) {
    const res = await this.eos_api.getTableRows({
      json: true,
      code: contract,
      scope: contract,
      table: 'follower',
      limit: 100,
      index_position: 2,
      key_type: "name",
      lower_bound: this.account.name,
    })
    console.log("following: ", res.rows)
    return res.rows.map(x => x.user)
  }
  
  async followRequests(user) {
    const res = await this.eos_api.getTableRows({
      json: true,
      code: contract,
      scope: contract,
      table: 'request',
      limit: 100,
      index_position: 2,
      key_type: "name",
      lower_bound: this.account.name,
    })
    console.log("followRequests: ", res.rows)
    return res.rows.map(x => x.follower)
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
}


export default new Backend()
