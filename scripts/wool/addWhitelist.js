// lp 0x75456D6cDA96743684f3CCa84d369D612060FCf2

// 0x3bb1df72a0c6A25C2a8D75Af9dc45fA43A60535f

// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require('hardhat')
const log = console.log.bind(console)
const contractFactoryPath = 'DogToken'
const contractAddress = '0xfE41A6Eb0e4B47303fc05AeBf88008A726EeC823'

async function main() {
    log(contractFactoryPath)
    const instance = await ethers.getContractAt(
        contractFactoryPath,
        contractAddress
    )

    let tx = await instance.addWhitelist('0x2F03BD3f2BE3D1185799A29707061b020623dCB5')
    await tx.wait(1)

    const res = await instance.whitelist("0x2F03BD3f2BE3D1185799A29707061b020623dCB5")
    log(res)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
