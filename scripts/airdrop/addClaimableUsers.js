// 0x3bb1df72a0c6A25C2a8D75Af9dc45fA43A60535f

// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require('hardhat')
const log = console.log.bind(console)
const contractFactoryPath = 'TPTAirdropPool'
const contractAddress = '0x98cfb8FDB8196f42579DB68ef718d4FaFDF0CbD4'
// const contractAddress = '0x16f08bd28ff3dc50fFc41f59b703ad104872c504'
let res

async function main() {
    log(contractFactoryPath)
    const instance = await ethers.getContractAt(
        contractFactoryPath,
        contractAddress
    )

    let tx = await instance.addClaimableUsers([`0x3bb1df72a0c6A25C2a8D75Af9dc45fA43A60535f`, `0x8dD689FEbe406363F2E2DE087d8B0400948817f6`])
    await tx.wait(1)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
