const { deployContract } = require('../utils/util')
const fs = require('fs')

const main = async () => {
    const contract = await deployContract('DogToken')

    const deployObj = {
        DogToken: contract.address,
    }

    fs.writeFileSync(
        __dirname + '/' + 'deployments' + '/' + 'DogTokenDogToken.json',
        JSON.stringify(deployObj, null, 2)
    )
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
