const { deployContractByWallet } = require('../utils/util')
const fs = require('fs')
const log = console.log.bind(console)

const main = async () => {

    let signers = await ethers.getSigners()
    const operator = signers[1]
    const contract = await deployContractByWallet(operator, 'EthDispatcher')

    log(`NSG EthDispatcher: `, contract.address)
    const deployObj = {
        EthDispatcher: contract.address,
    }

    fs.writeFileSync(
        __dirname + '/' + 'deployments' + '/' + 'EthDispatcher-NSG.json',
        JSON.stringify(deployObj, null, 2)
    )
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
