const { getContract } = require('./helper')
const { waitTx } = require('./helper')

async function main() {
    const unit = ethers.constants.WeiPerEther

    let tx
    console.log('network: ' + network.name)
    let [operator] = await ethers.getSigners()

    let lottery = await getContract(
        operator,
        'Lottery',
        '0x7ab26e0a05515340E22b335769483055e11E4d6B'
    )
    console.log(`lottery: ${lottery.address}`)

    tx = await lottery.reset()
    await waitTx(tx)

    console.log(`done`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
