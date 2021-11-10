// Shoutout to Dabbit for helping w/ this!
// https://twitter.com/dabit3

// All this script does is it will write a key pair directly to our file system, that way anytime people come to our web app they'll all load the same key pair.

const fs = require('fs')
const anchor = require('@project-serum/anchor')

const account = anchor.web3.Keypair.generate()

fs.writeFileSync('./keypair.json', JSON.stringify(account))
