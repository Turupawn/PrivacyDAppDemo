import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import { Noir } from '@noir-lang/noir_js';
import circuit from './circuit/target/circuit.json';

const NETWORK_ID = 534351

const MY_CONTRACT_ADDRESS = "0xf60c063E83a52d74233d97574Ff1266DC2dC6071"
const MY_CONTRACT_ABI_PATH = "./json_abi/Verifier.json"
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
          my_contract = await getContract(web3, MY_CONTRACT_ADDRESS, MY_CONTRACT_ABI_PATH)
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
  var messageAmount = await my_contract.methods.messageAmount().call()
  var contract_state = "messageAmount: " + messageAmount
  
  var maxMsgPerPage = 5;
  var pageIterator = 0;
  var messagesElement = document.getElementById("messages");

  for(var i=parseInt(messageAmount);i>0;i--)
  {
    var message = await my_contract.methods.messages(i-1).call()
    var paragraph = document.createElement("p");
    paragraph.textContent = "Anon: " + message;
    messagesElement.appendChild(paragraph);
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

function arrayifyString(str) {
  return str.match(/.{1,2}/g) || [];
}

function splitArray(array) {
  const middleIndex = Math.ceil(array.length / 2);
  const firstHalf = array.slice(0, middleIndex);
  const secondHalf = array.slice(middleIndex);

  return [firstHalf, secondHalf];
}

function hashMessage(message) {
  const hashedMessage = ethers.utils.hashMessage(message);
  return hashedMessage;
}

const sendProof = async (_message) => {
  var message = _message
  var deadline = "9999999999"
  var msgParams = JSON.stringify({
    types: {
        EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
        ],
        Greeting: [
            { name: 'text', type: 'string' },
            { name: 'deadline', type: 'uint' }
        ],
    },
    primaryType: 'Greeting',
    domain: {
        name: 'Ether Mail',
        version: '1',
        chainId: NETWORK_ID,
        verifyingContract: MY_CONTRACT_ADDRESS,
    },
    message: {
        text: message,
        deadline: deadline,
    },
  });
  console.log(msgParams)

  console.log(0)
  console.log(0)
  console.log(0)

  const messagex = "x";
  const hashedMessagex = hashMessage(messagex);
  console.log(hashedMessagex)

  console.log("dois")
  
  console.log(ethers.utils.hashMessage("{\"types\":{\"EIP712Domain\":[{\"name\":\"name\",\"type\":\"string\"},{\"name\":\"version\",\"type\":\"string\"},{\"name\":\"chainId\",\"type\":\"uint256\"},{\"name\":\"verifyingContract\",\"type\":\"address\"}],\"Greeting\":[{\"name\":\"text\",\"type\":\"string\"},{\"name\":\"deadline\",\"type\":\"uint\"}]},\"primaryType\":\"Greeting\",\"domain\":{\"name\":\"Ether Mail\",\"version\":\"1\",\"chainId\":534351,\"verifyingContract\":\"0xc36e59a32E18C6dC9caCf64639de7cFfDE83BC5f\"},\"message\":{\"text\":\"asdf\",\"deadline\":\"9999999999\"}}"))
  console.log(ethers.utils.hashMessage(msgParams))
  console.log(ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("\x19Ethereum Signed Message:\n1x")
    ))
  //0x3ef9a3d61fed6a33fff709f4d34ee92bffacc346e7e2233876018e2dde33faa8


console.log(111)
console.log(ethers.utils.hashMessage(msgParams))
console.log(222)

  //msgParams = "{\"types\":{\"EIP712Domain\":[{\"name\":\"name\",\"type\":\"string\"},{\"name\":\"version\",\"type\":\"string\"},{\"name\":\"chainId\",\"type\":\"uint256\"},{\"name\":\"verifyingContract\",\"type\":\"address\"}],\"Greeting\":[{\"name\":\"text\",\"type\":\"string\"},{\"name\":\"deadline\",\"type\":\"uint\"}]},\"primaryType\":\"Greeting\",\"domain\":{\"name\":\"Ether Mail\",\"version\":\"1\",\"chainId\":534351,\"verifyingContract\":\"0xc36e59a32E18C6dC9caCf64639de7cFfDE83BC5f\"},\"message\":{\"text\":\"asdf\",\"deadline\":\"9999999999\"}}"

  var signature = await ethereum.request({
    method: "eth_signTypedData_v4",
    params: [accounts[0], msgParams],
  });

  console.log("Hashed message: ")
  var hashedMessage = ethers.utils.hashMessage(msgParams)
  console.log(hashedMessage)
  
  const hashedMessageArray = ethers.utils.arrayify(hashedMessage)
  //arrayifyString(hashedMessage.substring(2)).map(hex => parseInt(hex, 16));
  console.log(hashedMessageArray);
  
  console.log("Signature: ")
  console.log(signature)

  const signatureArray = ethers.utils.arrayify(signature)
  //arrayifyString(signature.substring(2)).map(hex => parseInt(hex, 16));
  console.log(signatureArray);

  console.log("Public key:")
  var publicKey = ethers.utils.recoverPublicKey(hashedMessage, signature)
  console.log(publicKey)
  publicKey = publicKey.substring(4)
  
  const publicKeyArray = ethers.utils.arrayify("0x"+publicKey)
  //arrayifyString(publicKey.substring(2)).map(hex => parseInt(hex, 16));
  console.log(publicKeyArray);
  //publicKeyArray.pop()//???

  let pub_key_x = publicKey.substring(0, 64);
  let pub_key_y = publicKey.substring(64);
  let arrayX = ethers.utils.arrayify("0x"+pub_key_x)
  let arrayY = ethers.utils.arrayify("0x"+pub_key_y)
  
  console.log(arrayX)
  console.log(arrayY)

  const backend = new BarretenbergBackend(circuit);
  const noir = new Noir(circuit, backend);

  var sArrayX = Array.from(arrayX)
  var sArrayY = Array.from(arrayY)
  var sSignature = Array.from(signatureArray)
  var sHashedMessage = Array.from(hashedMessageArray)
  sSignature.pop()
  
  const input = {
    pub_key_x: Array.from(sArrayX),
    pub_key_y: Array.from(arrayY),
    signature: sSignature,
    hashed_message: Array.from(hashedMessageArray)
  };
  document.getElementById("web3_message").textContent="Generating proof... ⌛";
  var proof = await noir.generateFinalProof(input);
  document.getElementById("web3_message").textContent="Generating proof... ✅";
  
  proof = "0x" + ethereumjs.Buffer.Buffer.from(proof.proof).toString('hex')
  //y = ethereumjs.Buffer.Buffer.from([y]).toString('hex')
  //y = "0x" + "0".repeat(64-y.length) + y
  console.log("Proof")
  console.log(proof)
  /*
*/

console.log(hashedMessage)
console.log(hashedMessage)
console.log(hashedMessage)

  var tHashedMessage = arrayifyString(hashedMessage.substring(2))
  for(var i=0; i<tHashedMessage.length; i++)
  {
    tHashedMessage[i] = "0x00000000000000000000000000000000000000000000000000000000000000" + tHashedMessage[i]
  }

  console.log(tHashedMessage)


  const result = await my_contract.methods.sendProof(proof
  , tHashedMessage, message)
  .send({ from: accounts[0], gas: 0, value: 0 })
  .on('transactionHash', function(hash){
    document.getElementById("web3_message").textContent="Executing...";
  })
  .on('receipt', function(receipt){
    document.getElementById("web3_message").textContent="Success.";    })
  .catch((revertReason) => {
    console.log("ERROR! Transaction reverted: " + revertReason.receipt.transactionHash)
  });
  /*

    document.getElementById("public_input").textContent = "public input: " + y
    document.getElementById("proof").textContent = "proof: " + proof

    const result = await my_contract.methods.sendProof(proof, [y])
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
window.sendProof=sendProof;