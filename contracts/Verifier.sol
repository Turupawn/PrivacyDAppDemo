// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

interface IUltraVerifier {
    function verify(bytes calldata _proof, bytes32[] calldata _publicInputs) external view returns (bool);
}

contract MessageVerifier {
    function stringToUtf8Bytes(string memory str) public pure returns (bytes memory) {
        return bytes(str);
    }

    // This is from Openzeppelin
    function log10(uint256 value) internal pure returns (uint256) {
        uint256 result = 0;
        unchecked {
            if (value >= 10 ** 64) {
                value /= 10 ** 64;
                result += 64;
            }
            if (value >= 10 ** 32) {
                value /= 10 ** 32;
                result += 32;
            }
            if (value >= 10 ** 16) {
                value /= 10 ** 16;
                result += 16;
            }
            if (value >= 10 ** 8) {
                value /= 10 ** 8;
                result += 8;
            }
            if (value >= 10 ** 4) {
                value /= 10 ** 4;
                result += 4;
            }
            if (value >= 10 ** 2) {
                value /= 10 ** 2;
                result += 2;
            }
            if (value >= 10 ** 1) {
                result += 1;
            }
        }
        return result;
    }

    bytes16 private constant HEX_DIGITS = "0123456789abcdef";

    function toStringg(uint256 value) internal pure returns (string memory) {
        unchecked {
            uint256 length = log10(value) + 1;
            string memory buffer = new string(length);
            uint256 ptr;
            /// @solidity memory-safe-assembly
            assembly {
                ptr := add(buffer, add(32, length))
            }
            while (true) {
                ptr--;
                /// @solidity memory-safe-assembly
                assembly {
                    mstore8(ptr, byte(mod(value, 10), HEX_DIGITS))
                }
                value /= 10;
                if (value == 0) break;
            }
            return buffer;
        }
    }


    function getLength(string memory s) public pure returns (uint256)  
    { 
        bytes memory b = bytes(s); 
        return b.length; 
    } 

    function hashMessageX(string memory message) public pure returns (bytes32) {
        uint messageLength = bytes(message).length;
        bytes32 hashedMessage = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n", toStringg(messageLength), message
            ));
        return hashedMessage;
    }
    function hashMessage(string memory message) public pure returns (bytes32) {
        string memory a = "{\"types\":{\"EIP712Domain\":[{\"name\":\"name\",\"type\":\"string\"},{\"name\":\"version\",\"type\":\"string\"},{\"name\":\"chainId\",\"type\":\"uint256\"},{\"name\":\"verifyingContract\",\"type\":\"address\"}],\"Greeting\":[{\"name\":\"text\",\"type\":\"string\"},{\"name\":\"deadline\",\"type\":\"uint\"}]},\"primaryType\":\"Greeting\",\"domain\":{\"name\":\"Ether Mail\",\"version\":\"1\",\"chainId\":534351,\"verifyingContract\":\"0xc36e59a32E18C6dC9caCf64639de7cFfDE83BC5f\"},\"message\":{\"text\":\"";
        string memory b = "\",\"deadline\":\"9999999999\"}}";
        return hashMessageX(string(abi.encodePacked(a,message, b)));
    }

    function isValidHash(bytes32 hash, string memory message) public pure returns(bool) {
        return hash == hashMessage(message);
    }


    function concatenateHexArray(bytes32[] memory hexArray) public pure returns (bytes32) {
        bytes32 result;
        for (uint256 i = 0; i < hexArray.length; i++) {
            result = result << 8 | hexArray[i];
        }
        return result;
    }




    uint public messageAmount;
    mapping(uint messageId => string message) messages;

    IUltraVerifier ultraVerifier = IUltraVerifier(0xCb7CfCdF413B803188c1536c09cEB15FC6F75866);

    function sendProof(bytes calldata _proof, bytes32[] calldata _publicInputs, string memory message) public
    {
        require(isValidHash(concatenateHexArray(_publicInputs), message), "Invalid message hash");
        ultraVerifier.verify(_proof, _publicInputs);
        messages[messageAmount] = message;
        messageAmount+=1;
    }

}