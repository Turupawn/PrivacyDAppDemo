import createAlchemyWeb3 from "@alch/alchemy-web3"
import dotenv from "dotenv"
import fs from "fs"
import cors from "cors"
import express from "express"

const app = express()
dotenv.config();

const JSON_CONTRACT_PATH = "./json_abi/CommentVerifier.json"
const PORT = 8080
var web3 = null
var contract = null

app.use(cors())


const { RPC_URL, CONTRACT_ADDRESS, RELAYER_PRIVATE_KEY, RELAYER_ADDRESS } = process.env;

const loadContract = async (data) => {
  data = JSON.parse(data);
  const deployedNetwork = await web3.eth.net.getId();
  contract = new web3.eth.Contract(
    data,
    deployedNetwork && deployedNetwork.address
  );
}

async function initAPI() {
  web3 = createAlchemyWeb3.createAlchemyWeb3(RPC_URL);

  fs.readFile(JSON_CONTRACT_PATH, 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }
    loadContract(data, web3)
  });

  app.listen(PORT, () => {
    console.log(`Listening to port ${PORT}`)
  })
}

async function relayMessage(proof, tHashedMessage, title, text)
{
  const nonce = await web3.eth.getTransactionCount(RELAYER_ADDRESS, 'latest'); // nonce starts counting from 0

  const transaction = {
   'from': RELAYER_ADDRESS,
   'to': CONTRACT_ADDRESS,
   'value': 0,
   'gas': 500000,
   'nonce': nonce,
   'data': contract.methods.sendProof(proof, tHashedMessage, title, text).encodeABI()
  };
  const signedTx = await web3.eth.accounts.signTransaction(transaction, RELAYER_PRIVATE_KEY);

  web3.eth.sendSignedTransaction(signedTx.rawTransaction, function(error, hash) {
    if (!error) {
      console.log("🎉 The hash of your transaction is: ", hash, "\n");
    } else {
      console.log("❗Something went wrong while submitting your transaction:", error)
    }
  });
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