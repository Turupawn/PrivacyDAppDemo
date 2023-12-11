# On-chain Privacy DApp Demo

This demo showcases all the parts needed to create a privacy preserving DApp with good UX.

## ⭐Features

| Feature | Supported |
|----------|------------ |
| Aztec Noir circuit | ✅ |
| Solidity verifier | ✅ |
| ECDSA verification circuit | ✅ |
| EIP712 enabled | ✅ |
| Prover on browser (WASM) | ✅ |
| Node.js relayer | ✅ |
| MIT license | ✅ |

## 🚀How to launch

Let's launch the relayer first. Fill the `.env` file based on `.env.example` on the `relayer/` directory and run the following.

```bash
cd relayer
npm install
npm start
```

Open a new terminal and launch the webapp. Now fill the `.env` file based on `.env.example` on the `webapp/`, the run the following.

```bash
cd webapp
npm install
npm start
```

The webapp will automatically open on your browser.

## ⚠️Known issues (PRs welcome)

* The relayer is using an old Alchemy web3 wrapper, we need to upgrade it to the newer ethers.js version
* We need to compress the hashed message params to reduce L1 fees on L2s. We should use [this](https://github.com/Bank-of-JubJub/base/blob/2a0247a441463a6619cc8d5f13d81717d166b770/hardhat/contracts/UsingAccountControllers.sol#L158) and [this](https://github.com/Bank-of-JubJub/base/blob/master/circuits/change_eth_signer/src/main.nr)