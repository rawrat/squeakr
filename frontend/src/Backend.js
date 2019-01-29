import { Api, JsonRpc, RpcError } from 'eosjs'
const { TextEncoder, TextDecoder } = require('text-encoding')

const rpc = new JsonRpc('http://127.0.0.1:8888');
// const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });
const contract = 'squeakrdappx'

class Backend {
  async squeaks() {
    const res = await rpc.get_table_rows({
      json: true,
      code: contract,
      scope: contract,
      table: 'squeak',
      limit: 100,
    })
    console.log("res.rows: ", res.rows)
    return res.rows
  }
}

export default new Backend()