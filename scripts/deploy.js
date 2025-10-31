#!/usr/bin/env node
/**
 * Usage:
 *   node scripts/deploy.js --token YOUR_WEB3_STORAGE_TOKEN --files ./dist
 *
 * This script uploads files to web3.storage and prints the CID.
 * It can optionally accept --domain and will prepare the transaction data for updating contenthash (ENS-style).
 *
 * Note: Sending the onchain transaction requires a signer/private key — this script only prints the required data
 * for safety. To send an onchain transaction, use ethers with a private key or a connected wallet.
 */
import fs from 'fs'
import path from 'path'
import minimist from 'minimist'
import { Web3Storage, getFilesFromPath } from 'web3.storage'

const argv = minimist(process.argv.slice(2))
const token = argv.token || process.env.W3_TOKEN
if(!token){ console.error('Missing token; pass --token or set W3_TOKEN'); process.exit(1) }

const filesArg = argv.files || argv._[0] || './'
async function main(){
  const client = new Web3Storage({ token })
  let filePaths = []
  try{
    filePaths = await getFilesFromPath(filesArg)
  }catch(e){
    console.error('Failed to read files from', filesArg, e)
    process.exit(1)
  }
  console.log('Uploading', filePaths.length, 'files...')
  const cid = await client.put(filePaths, { wrapWithDirectory: true })
  console.log('✅ Uploaded. CID:', cid)
  if(argv.domain){
    console.log('Domain specified:', argv.domain)
    console.log('To update contenthash onchain, you will need to call your registry/resolver with contenthash ipfs://' + cid)
    console.log('This script does NOT send transactions. Use prepare-tx or your own tooling.')
  }
}
main().catch(e=>{ console.error(e); process.exit(1) })
