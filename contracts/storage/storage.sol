//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

contract SimpleStorage {
    uint holders;
    mapping (address => bool) isAdmins;

    modifier onlyAdmin() {
        require(isAdmins[msg.sender], "caller is not one of admins");
        _;
    }

    constructor () public {
        isAdmins[msg.sender] = true;
    }

    function setAdmin(address admin) public onlyAdmin {
        isAdmins[admin] = true;
    }

    function setHolders(uint _holders) public onlyAdmin {
        require(_holders > 0, "holders must > 0");
        holders = _holders;
    }

    function getHolders() public view returns (uint) {
        return holders;
    }
}
