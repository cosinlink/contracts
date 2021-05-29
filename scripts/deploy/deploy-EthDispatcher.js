const { deployContract } = require('../utils/util')
const fs = require('fs')
const log = console.log.bind(console)

const main = async () => {
    const contract = await deployContract('EthDispatcher')

    log(`EthDispatcher: `, contract.address)
    const deployObj = {
        EthDispatcher: contract.address,
    }

    fs.writeFileSync(
        __dirname + '/' + 'deployments' + '/' + 'EthDispatcher.json',
        JSON.stringify(deployObj, null, 2)
    )
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
