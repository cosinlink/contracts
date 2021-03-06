const { deployContract, log } = require('../utils/util')
async function main() {
    const [account1, account2, account3] = await ethers.getSigners()
    log(account1.address, account2.address, account3.address)

    let factory = await ethers.getContractFactory('MdexPair')
    factory = factory.connect(account3)
    let contract = await factory.deploy()
    await contract.deployTransaction.wait(1)
    log(contract.address)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
