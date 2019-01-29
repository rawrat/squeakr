import { Api, JsonRpc, RpcError } from 'eosjs'
const { TextEncoder, TextDecoder } = require('text-encoding')
import config from './config'
const rpc = new JsonRpc(config.httpEndpoint)
// const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });
const contract = 'squeakrdappx'

import ScatterJS from 'scatterjs-core'
import ScatterEOS from 'scatterjs-plugin-eosjs2'

// Don't forget to tell ScatterJS which plugins you are using.
ScatterJS.plugins( new ScatterEOS() )

class Backend {
  constructor() {
    this.options = {
      blocksBehind: 3,
      expireSeconds: 30,
    }
  }
  
  async scatterConnect() {
    console.log("Ohai scatterConnect")
    if(this.scatter && this.api) {
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
    
    this.api = this.scatter.eos(config.network, Api, {rpc, beta3:true})
    await this.scatter.login({accounts: [config.network]})
    this.account = this.scatter.identity.accounts.find(x => x.blockchain === 'eos')
  }
  
  async squeaks() {
    const res = await rpc.get_table_rows({
      json: true,
      code: contract,
      scope: contract,
      table: 'squeak',
      limit: 100,
    })
    console.log("rows: ", res.rows)
    // show most recent tweet at the top
    const sorted = res.rows.sort((a,b) => b.timestamp - a.timestamp)
    return sorted
  }
  
  async post(text) {
    const actions = [{
      account: contract,
      name: 'post',
      authorization: [{
        actor: this.account.name,
        permission: this.account.authority,
      }],
      data: {
        user: this.account.name,
        secret: text,
        nonce: "Nonce",
      }
    }]
    console.log("actions: ", JSON.stringify(actions))
    const result = await this.api.transact({actions}, this.options)
    console.log("result: ", JSON.stringify(result))
  }
}

export default new Backend()