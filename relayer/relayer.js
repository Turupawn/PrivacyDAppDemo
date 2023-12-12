import dotenv from "dotenv"
import fs from "fs"
import cors from "cors"
import express from "express"
import { ethers } from 'ethers';

const app = express()
dotenv.config();

const JSON_CONTRACT_PATH = "./json_abi/CommentVerifier.json"
const PORT = 8080
var contract = null
var provider
var signer
var ABI

app.use(cors())

const { RPC_URL, CONTRACT_ADDRESS, RELAYER_PRIVATE_KEY, RELAYER_ADDRESS } = process.env;

const loadContract = async (data) => {
  data = JSON.parse(data);
  ABI = data
  contract = new ethers.Contract(CONTRACT_ADDRESS, data, signer);
}

async function initAPI() {
  provider = new ethers.JsonRpcProvider(RPC_URL);
  signer = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider);

  fs.readFile(JSON_CONTRACT_PATH, 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }
    loadContract(data)
  });

  app.listen(PORT, () => {
    console.log(`Listening to port ${PORT}`)
  })
}

async function relayMessage(proof, tHashedMessage, title, text)
{
  // Get the nonce
  const nonce = await provider.getTransactionCount(RELAYER_ADDRESS);

  // Transaction details
  const transaction = {
    from: RELAYER_ADDRESS,
    to: CONTRACT_ADDRESS,
    value: '0', // Set the value in Ether if needed
    gasPrice: "700000000",
    nonce: nonce,
    chainId: "534351",
    data: contract.interface.encodeFunctionData(
      "sendProof",[proof, tHashedMessage, title, text]
    )
  };

  // Sign the transaction
  const signedTransaction = await signer.populateTransaction(transaction);

  // Send the signed transaction
  const transactionResponse = await signer.sendTransaction(signedTransaction);

  console.log('🎉 The hash of your transaction is:', transactionResponse.hash);
}

app.get('/relay', (req, res) => {
  var proof = req.query["proof"]
  var hashedMessage = req.query["hashedMessage"].split(',')
  var title = req.query["title"]
  var text = req.query["text"]

  relayMessage(proof, hashedMessage, title, text)

  res.setHeader('Content-Type', 'application/json');
  res.send({
    "message": "the proof was relayed"
  })
})
initAPI()