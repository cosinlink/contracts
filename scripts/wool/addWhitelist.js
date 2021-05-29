// lp 0x75456D6cDA96743684f3CCa84d369D612060FCf2

// 0x3bb1df72a0c6A25C2a8D75Af9dc45fA43A60535f

// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require('hardhat')
const log = console.log.bind(console)
const contractFactoryPath = 'HippoToken'
const contractAddress = '0x2E094E3732A605B5d01d8EfCFf22D83463D9405A'

async function main() {
    log(contractFactoryPath)
    const instance = await ethers.getContractAt(
        contractFactoryPath,
        contractAddress
    )

    let tx = await instance.addWhitelist('0x4d1972c03b92c6763ecbdc5093d37084248c1229')
    await tx.wait(1)

    const res = await instance.whitelist("0x4d1972c03b92c6763ecbdc5093d37084248c1229")
    log(res)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
