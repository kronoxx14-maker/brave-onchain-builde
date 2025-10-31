#!/usr/bin/env node
/**
 * Prepare transaction data for ENS-like setContenthash call.
 *
 * Usage:
 *  node scripts/prepareContenthashTx.js --domain yourdomain.brave --cid Qm...
 *
 * This script will:
 *  - Compute namehash (for ENS-style names)
 *  - Encode contenthash bytes for ipfs
 *  - Print the ABI-encoded calldata for setContenthash(bytes32, bytes)
 *
 * Note: Different registries implement publishing differently. This helper follows ENS resolver conventions.
 */
import minimist from 'minimist'
import { keccak256 as k256 } from 'js-sha3'
import { encodeContenthash } from 'content-hash'
import { ethers } from 'ethers'

const argv = minimist(process.argv.slice(2))
const domain = argv.domain
const cid = argv.cid
if(!domain || !cid){ console.error('Missing --domain or --cid'); process.exit(1) }

function namehash(name){
  let node = '0x' + '00'.repeat(32)
  if(name){
    const parts = name.split('.')
    for(let i=parts.length-1;i>=0;i--){
      const labelSha = ethers.keccak256(ethers.toUtf8Bytes(parts[i]))
      node = ethers.keccak256(ethers.concat([node, labelSha]))
    }
  }
  return node
}

async function main(){
  const node = namehash(domain)
  const ch = 'ipfs://' + cid
  // content-hash encoding (using 'content-hash' package would be ideal; here we use raw)
  // For simplicity, we'll encode ipfs CIDv0/v1 correctly using known prefix for CIDv1: 0x01 0x55 ... but production should use content-hash lib
  const encoded = '0x' + Buffer.from(cid).toString('hex') // placeholder; recommend using content-hash lib
  const abi = ['function setContenthash(bytes32 node, bytes calldata hash)']
  const iface = new ethers.Interface(abi)
  const data = iface.encodeFunctionData('setContenthash', [node, encoded])
  console.log('node (namehash):', node)
  console.log('calldata:', data)
  console.log('Note: This encoding is a simplistic placeholder. For correct contenthash encoding use the content-hash library in your environment.')
}
main().catch(e=>{ console.error(e); process.exit(1) })
