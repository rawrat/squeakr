'use strict'
const restify = require('restify')
const Eos = require('eosjs')
const corsMiddleware = require('restify-cors-middleware')
const assert = require('assert')
const eosjs_ecc = require('eosjs-ecc')
const server = restify.createServer()
server.use(restify.plugins.bodyParser())

const cors = corsMiddleware({
  preflightMaxAge: 5,
  origins: ['*'],
  allowHeaders: [''],
  exposeHeaders: ['']
})
 
server.pre(cors.preflight)
server.use(cors.actual)

const private_key = "5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3"
const contract = "squeakrdappx"
const authority = "active"

const config = {
  chainId: "cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f", // 32 byte (64 char) hex string
  keyProvider: [private_key], // WIF string or array of keys..
  httpEndpoint: 'http://127.0.0.1:8888',
  broadcast: false,
}
const eos = Eos(config)


server.post('/userreg', async function(req, res, next) {
  const body = req.body
  const pubkey = body.public_key
  const username = body.username
  console.log(`Register ${username} @ ${pubkey}`)
  
  const actions = [{
    account: contract,
    name: 'userreg',
    authorization: [{
      actor: contract,
      permission: authority,
    }],
    data: {
      username,
      pubkey,
    }
  }]
  eos.transaction({actions})
  
  next()
})

server.post('/squeak', async function(req, res, next) {
  /*
   * message: encrypted message
   * signature: message signed by the user's private key
   */
  
  const body = req.body
  const public_key = body.public_key
  const message = body.message
  const signature = body.signature 

  console.log(`Message: ${message} Signature: ${signature} public_key: ${public_key}`)

  assert.ok(eosjs_ecc.verify(signature, message, public_key))
  
  // issue a transaction as the app that store message & signature
  
	next()
})

server.listen("5432", "127.0.0.1", function() {
  console.info(`Squeakr Backend listening at ${server.url}`)
	if(process.send) {
		process.send('ready')		
	}
})
