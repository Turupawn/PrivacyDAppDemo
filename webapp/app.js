import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import { Noir } from '@noir-lang/noir_js';
import circuit from '../circuit/target/circuit.json';

const NETWORK_ID = process.env.CHAIN_ID

const METADA_API_URL = "http://localhost:8080"

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const MY_CONTRACT_ABI_PATH = "../json_abi/CommentVerifier.json"
var my_contract

var accounts
var web3

function metamaskReloadCallback() {
  window.ethereum.on('accountsChanged', (accounts) => {
    document.getElementById("web3_message").textContent="Se cambió el account, refrescando...";
    window.location.reload()
  })
  window.ethereum.on('networkChanged', (accounts) => {
    document.getElementById("web3_message").textContent="Se el network, refrescando...";
    window.location.reload()
  })
}

const getWeb3 = async () => {
  return new Promise((resolve, reject) => {
    if(document.readyState=="complete")
    {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum)
        window.location.reload()
        resolve(web3)
      } else {
        reject("must install MetaMask")
        document.getElementById("web3_message").textContent="Error: Please connect to Metamask";
      }
    }else
    {
      window.addEventListener("load", async () => {
        if (window.ethereum) {
          const web3 = new Web3(window.ethereum)
          resolve(web3)
        } else {
          reject("must install MetaMask")
          document.getElementById("web3_message").textContent="Error: Please install Metamask";
        }
      });
    }
  });
};

const getContract = async (web3, address, abi_path) => {
  const response = await fetch(abi_path);
  const data = await response.json();
  
  const netId = await web3.eth.net.getId();
  var contract = new web3.eth.Contract(
    data,
    address
    );
  return contract
}

async function loadDapp() {
  metamaskReloadCallback()
  document.getElementById("web3_message").textContent="Please connect to Metamask"
  var awaitWeb3 = async function () {
    web3 = await getWeb3()
    web3.eth.net.getId((err, netId) => {
      if (netId == NETWORK_ID) {
        var awaitContract = async function () {
          my_contract = await getContract(web3, CONTRACT_ADDRESS, MY_CONTRACT_ABI_PATH)
          document.getElementById("web3_message").textContent="You are connected to Metamask"
          onContractInitCallback()
          web3.eth.getAccounts(function(err, _accounts){
            accounts = _accounts
            if (err != null)
            {
              console.error("An error occurred: "+err)
            } else if (accounts.length > 0)
            {
              onWalletConnectedCallback()
              document.getElementById("account_address").style.display = "block"
            } else
            {
              document.getElementById("connect_button").style.display = "block"
            }
          });
        };
        awaitContract();
      } else {
        document.getElementById("web3_message").textContent="Please connect to Scroll Sepolia";
      }
    });
  };
  awaitWeb3();
}

async function connectWallet() {
  await window.ethereum.request({ method: "eth_requestAccounts" })
  accounts = await web3.eth.getAccounts()
  onWalletConnectedCallback()
}
window.connectWallet=connectWallet;

const onContractInitCallback = async () => {
  var commentAmount = await my_contract.methods.commentAmount().call()
  var contract_state = "commentAmount: " + commentAmount
  
  var maxMsgPerPage = 5;
  var pageIterator = 0;
  var commentsElement = document.getElementById("comments");

  for(var i=parseInt(commentAmount);i>0;i--)
  {
    var title = await my_contract.methods.titles(i-1).call()
    var text = await my_contract.methods.texts(i-1).call()
    var paragraph = document.createElement("p");
    var boldElement = document.createElement("b");
    var textElement = document.createElement("span");
    var brElement = document.createElement("br");
    var titleElement = document.createElement("span");
    titleElement.textContent = title;
    textElement.textContent = text;
    boldElement.appendChild(titleElement);
    paragraph.appendChild(boldElement);
    paragraph.appendChild(brElement);
    paragraph.appendChild(textElement);
    commentsElement.appendChild(paragraph);
    pageIterator++
    if(pageIterator >= maxMsgPerPage)
    {
      break
    }
  }
  document.getElementById("contract_state").textContent = contract_state;
}

const onWalletConnectedCallback = async () => {
}

document.addEventListener('DOMContentLoaded', async () => {
    loadDapp()
});

function splitIntoPairs(str) {
  return str.match(/.{1,2}/g) || [];
}

const sendProof = async (title, text) => {
  document.getElementById("web3_message").textContent="Please sign the message ✍️";
  var msgParams = JSON.stringify({
    types: {
        EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
        ],
        Comment: [
            { name: 'title', type: 'string' },
            { name: 'text', type: 'string' }
        ],
    },
    primaryType: 'Comment',
    domain: {
        name: 'Anon Message Board',
        version: '1',
        chainId: NETWORK_ID,
        verifyingContract: CONTRACT_ADDRESS,
    },
    message: {
        title: title,
        text: text,
    },
  });
  
  var signature = await ethereum.request({
    method: "eth_signTypedData_v4",
    params: [accounts[0], msgParams],
  });

  var hashedMessage = ethers.utils.hashMessage(msgParams)  
  const hashedMessageArray = ethers.utils.arrayify(hashedMessage)
  
  var publicKey = ethers.utils.recoverPublicKey(hashedMessage, signature)
  publicKey = publicKey.substring(4)
  
  let pub_key_x = publicKey.substring(0, 64);
  let pub_key_y = publicKey.substring(64);
  
  const backend = new BarretenbergBackend(circuit);
  const noir = new Noir(circuit, backend);

  var sSignature = Array.from(ethers.utils.arrayify(signature))
  sSignature.pop()
  
  const input = {
    pub_key_x: Array.from(ethers.utils.arrayify("0x"+pub_key_x)),
    pub_key_y: Array.from(ethers.utils.arrayify("0x"+pub_key_y)),
    signature: sSignature,
    hashed_message: Array.from(hashedMessageArray)
  };

  document.getElementById("web3_message").textContent="Generating proof... ⌛";
  var proof = await noir.generateFinalProof(input);
  document.getElementById("web3_message").textContent="Generating proof... ✅";
  
  proof = "0x" + ethereumjs.Buffer.Buffer.from(proof.proof).toString('hex')

  var tHashedMessage = splitIntoPairs(hashedMessage.substring(2))
  for(var i=0; i<tHashedMessage.length; i++)
  {
    tHashedMessage[i] = "0x00000000000000000000000000000000000000000000000000000000000000" + tHashedMessage[i]
  }

  await updateMetadata(proof, tHashedMessage, title, text)

  /*
  const result = await my_contract.methods.sendProof(proof, tHashedMessage, title, text)
  .send({ from: accounts[0], gas: 0, value: 0 })
  .on('transactionHash', function(hash){
    document.getElementById("web3_message").textContent="Executing...";
  })
  .on('receipt', function(receipt){
    document.getElementById("web3_message").textContent="Success.";    })
  .catch((revertReason) => {
    console.log("ERROR! Transaction reverted: " + revertReason.receipt.transactionHash)
  });
  */


}

const updateMetadata = async (proof, hashedMessage, title, text) => {
  fetch(METADA_API_URL + "/relay?proof=" + proof + "&hashedMessage=" + hashedMessage + "&title=" + title + "&text=" + text)
  .then(res => res.json())
  .then(out =>
    console.log(out))
  .catch();
}


window.sendProof=sendProof;