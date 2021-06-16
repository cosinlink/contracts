const { deployContract } = require('../utils/util')
const fs = require('fs')

const main = async () => {
    const contract = await deployContract('CryptExLpTokenLockerV2')

    const deployObj = {
        TokenLocker: contract.address,
    }

    fs.writeFileSync(
        __dirname + '/' + 'deployments' + '/' + 'CRVTokenLockerV2.json',
        JSON.stringify(deployObj, null, 2)
    )
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
