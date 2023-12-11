# On-chain Privacy DApp Demo

This demo shows all the parts needed to create a privacy preserving on-chain DApp.

## Features

| Feature | Supported |
|----------|------------ |
| Aztec Noir Circuit | ✔ |
| Solidity Verifier | ✔ |
| EIP712 Enabled | ✔ |
| WASM Prover | ✔ |
| Node.js Relayer | ✔ |
| MIT license | ✔ |

## How to launch

Let's launch the relayer first. Fill the `.env` based on `.env.example` and run the following.

```bash
cd relayer
npm install
npm start
```

Open a new terminal and launch the webapp. Also filling the `.env` file based on `.env.example`, the run the following.

```bash
cd webapp
npm install
npm start
```