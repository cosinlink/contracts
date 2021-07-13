pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract Tuha is ERC721, Ownable {
    using SafeMath for uint256;

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    struct Property {
        bool exist;
        uint256 luck;
        bool ancestor;
    }

    // tokenId => Property
    mapping(uint256 => Property) record;


    constructor (
        string memory name_,
        string memory symbol_
    ) public ERC721(
        name_,
        symbol_
    ) {}

    function mint(address[] memory who, uint256[] memory luck, bool[] memory ancestor) external onlyOwner {
        require(who.length == luck.length && luck.length == ancestor.length, "length");

        for (uint256 i = 0; i < who.length; i ++) {
            _tokenIdCounter.increment();
            uint256 newId = _tokenIdCounter.current();
            _safeMint(who[i], newId);
            Property storage property = record[newId];
            property.exist = true;
            property.luck = luck[i];
            property.ancestor = ancestor[i];
        }

    }

    function getProperty(uint256 tokenId) external view returns (Property memory){
        require(_exists(tokenId), "tokenId must exists");

        Property storage token = record[tokenId];

        //auto copy from storage to memory
        return token;
    }
}
