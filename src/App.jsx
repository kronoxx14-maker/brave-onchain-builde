import React, { useEffect, useState, useRef } from 'react'
import { Web3Storage } from 'web3.storage'
import { ethers } from 'ethers'

export default function App(){
  const [address, setAddress] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('w3token') || '')
  const [files, setFiles] = useState([])
  const [cid, setCid] = useState(localStorage.getItem('lastCID') || '')
  const [uploading, setUploading] = useState(false)
  const [progressPct, setProgressPct] = useState(0)
  const [progressText, setProgressText] = useState('')
  const [history, setHistory] = useState(()=>{ try{ return JSON.parse(localStorage.getItem('uploadHistory')||'[]') }catch{return []} })
  const templates = useRef({
    portfolio: { 'index.html': '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Portfolio</title></head><body><h1>Portfolio</h1></body></html>' },
    blog: { 'index.html': '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Blog</title></head><body><h1>Blog</h1></body></html>' },
    landing: { 'index.html': '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Landing</title></head><body><h1>Landing</h1></body></html>' }
  })

  useEffect(()=>{ localStorage.setItem('w3token', token) },[token])
  useEffect(()=>{ localStorage.setItem('lastCID', cid) },[cid])
  useEffect(()=>{ localStorage.setItem('uploadHistory', JSON.stringify(history)) },[history])

  const connectWallet = async () => {
    if(!window.ethereum) return alert('Open in Brave or web3-enabled browser')
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      const p = new ethers.providers.Web3Provider(window.ethereum)
      const signer = p.getSigner()
      const a = await signer.getAddress()
      setAddress(a)
    } catch(e) { console.error(e) }
  }

  function handleFilesSelected(list){
    setFiles(prev => [...prev, ...Array.from(list)])
  }
  function removeFileAt(i){ setFiles(prev => prev.filter((_,idx)=>idx!==i)) }
  function clearFiles(){ setFiles([]) }

  async function uploadToIPFS({ useIPNS=false } = {}){
    if(!token) return alert('Paste your web3.storage token')
    if(files.length===0) return alert('Select files first')
    setUploading(true)
    setProgressPct(0); setProgressText('Starting...')
    try{
      const client = new Web3Storage({ token })
      const w3Files = files.map(f => new File([f], f.name))
      let uploaded = 0, total = w3Files.reduce((s,f)=>s+f.size,0), start = Date.now()
      const cidResult = await client.put(w3Files, {
        wrapWithDirectory:true,
        onStoredChunk: size => {
          uploaded += size
          const pct = Math.round((uploaded/total)*100)
          const elapsed = (Date.now()-start)/1000
          const speed = uploaded/elapsed
          const eta = Math.round((total-uploaded)/(speed||1))
          setProgressPct(pct)
          setProgressText(`${pct}% — ${(uploaded/1e6).toFixed(2)} / ${(total/1e6).toFixed(2)} MB — ETA ${eta}s`)
        }
      })
      setCid(cidResult)
      setProgressPct(100)
      setProgressText('Upload complete')
      setHistory(prev => [{cid:cidResult, ts:Date.now(), size: files.reduce((s,f)=>s+f.size,0), files: files.map(f=>f.name)}, ...prev])
    } catch(e){
      console.error(e)
      setProgressText('Upload failed: ' + (e.message||e))
    } finally {
      setUploading(false)
    }
  }

  function gatewayLinksFor(cid){
    return [
      {name:'Brave', url:`https://dweb.brave.com/ipfs/${cid}`},
      {name:'ipfs.io', url:`https://ipfs.io/ipfs/${cid}`},
      {name:'cloudflare', url:`https://cloudflare-ipfs.com/ipfs/${cid}`}
    ]
  }

  async function deployTemplate(key){
    const tpl = templates.current[key]; if(!tpl) return
    const blobFiles = Object.entries(tpl).map(([name,content]) => new File([content], name, { type: 'text/html' }))
    setFiles(blobFiles)
    setTimeout(()=>uploadToIPFS(), 300)
  }

  return (
    <div style={{padding:24}}>
      <h1>Brave Onchain Builder</h1>
      <div>
        <button onClick={connectWallet}>{address ? 'Connected: ' + address.slice(0,6)+'...' : 'Connect Wallet'}</button>
      </div>
      <div style={{marginTop:12}}>
        <input value={token} onChange={e=>setToken(e.target.value)} placeholder="web3.storage token" style={{width:'100%'}} />
        <input type="file" multiple onChange={e=>handleFilesSelected(e.target.files)} style={{marginTop:8}} />
        <div style={{marginTop:8}}>
          {files.map((f,i)=> <div key={i}>{f.name} <button onClick={()=>removeFileAt(i)}>Remove</button></div>)}
        </div>
        <div style={{marginTop:8}}>Total: {(files.reduce((s,f)=>s+f.size,0)/1e6).toFixed(2)} MB</div>
        <div style={{marginTop:8}}><button onClick={()=>uploadToIPFS()}>Upload to IPFS</button> <button onClick={()=>deployTemplate('portfolio')}>Deploy portfolio template</button></div>
        <div style={{marginTop:8}}>Progress: {progressText}</div>
      </div>

      <div style={{marginTop:24}}>
        <h3>Last CID</h3>
        <div>{cid || '—'}</div>
        {cid && gatewayLinksFor(cid).map(g=> <a key={g.name} href={g.url} target="_blank" rel="noreferrer">{g.name} </a>)}
      </div>

      <div style={{marginTop:24}}>
        <h3>History</h3>
        {history.map(h=> <div key={h.cid}><strong>{h.cid}</strong> {(new Date(h.ts)).toLocaleString()} — {(h.size/1e6).toFixed(2)} MB <button onClick={()=>window.open('https://ipfs.io/ipfs/'+h.cid)}>Preview</button></div>)}
      </div>
    </div>
  )
}
