# Brave Onchain Builder

A React + Vite single-page app to help builders deploy on-chain websites for `.brave` domains.

## Features
- Client-side upload to IPFS using `web3.storage`
- Drag-and-drop, progress, ETA, templates, history
- CLI helper to upload folders and prepare transaction calldata for updating contenthash
- Starter templates (Portfolio, Blog, Landing)
- Gateway preview links and copy-to-clipboard helpers

## Quick start

1. Install:
```bash
npm install
```

2. Run dev:
```bash
npm run dev
```

3. Build:
```bash
npm run build
```

4. Deploy from CLI:
```bash
node scripts/deploy.js --token YOUR_WEB3_STORAGE_TOKEN --files ./dist
```

5. Prepare onchain tx data (ENS-style placeholder):
```bash
node scripts/prepareContenthashTx.js --domain yourdomain.brave --cid Qm...
```

> Important: Onchain publishing (setting the contenthash on a `.brave` domain) depends on the registry/resolver implementation. The `prepareContenthashTx.js` script outputs the calldata for an ENS-like `setContenthash` call but should be adapted to the specific registry you use. Do **not** send private keys or run transactions without reviewing the contract addresses and ABIs.

