const {deployContract} = require('../utils/util')
const fs = require('fs')

const main = async () => {
    const instance = await deployContract('Multicall')
    const deployObj = {
        'Multicall': instance.address
    }

    fs.writeFileSync(
        __dirname + '/' + 'deployments' + '/' + '1.json',
        JSON.stringify(deployObj, null, 2)
    )
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
