const { deployContract, log } = require('../utils/util')
// token address = 0x569b890EE400f959cEA497a91AC404597a608b86
async function main() {
    const [account1] = await ethers.getSigners()
    log(account1.address)

    let factory = await ethers.getContractFactory('WoolToken')
    factory = factory.connect(account1)
    let contract = await factory.deploy()
    await contract.deployTransaction.wait(1)
    log(contract.address)

    // setMinter
    let tx = await contract.setMinter(account1.address)
    await tx.wait(1)

    // mint
    const unit = ethers.constants.WeiPerEther
    tx = await contract.mint(account1.address, unit.mul(9999))
    await tx.wait(1)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
