const { deployContract } = require('../utils/util')
const fs = require('fs')

const main = async () => {
    // // 1.
    // const TPTInstance = await deployContract('TPTAirdropPool')
    //
    // // 2.
    // const MDXInstance = await deployContract('MDXAirdropPool')

    const simpleStorage = await deployContract('SimpleStorage')

    const deployObj = {
        AMAAirdropPool: simpleStorage.address,
    }

    fs.writeFileSync(
        __dirname + '/' + 'deployments' + '/' + 'storage-holders.json',
        JSON.stringify(deployObj, null, 2)
    )
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
