const { deployContract } = require('../utils/util')
const fs = require('fs')

// 2 days
const timeDelay = 172800

const main = async () => {
    const contract = await deployContract(
        'Timelock',
        '0xc5b5E4069237Aa4946BC35D04d7edb91a6b8Add0',
        timeDelay,
    )

    const deployObj = {
        Timelock: contract.address,
        TimeDelay: timeDelay
    }

    fs.writeFileSync(
        __dirname + '/' + 'deployments' + '/' + 'Timelock.json',
        JSON.stringify(deployObj, null, 2)
    )
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
