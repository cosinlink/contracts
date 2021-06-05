const fs = require('fs')
const addrList = []
const log = console.log.bind(console)

const main = async () => {
    const unit = ethers.constants.WeiPerEther

    let signers = await ethers.getSigners()
    log(`address: `, signers.length)
    const operator = signers[0]
    let contract = await ethers.getContractAt(
        'EthDispatcher',
        '0x1A67e1c17d1140Ce51BB26b4E77fE031E8df71de'
    )

    const tokenAddr = "0xdf0816cc717216c8b0863af8d4f0fc20bc65d643"
    let tokenContract = await ethers.getContractAt(
        'MdexPair',
        tokenAddr
    )
    let MaxUint256 = ethers.constants.MaxUint256
    let tx
    // tx = await tokenContract.approve('0x1A67e1c17d1140Ce51BB26b4E77fE031E8df71de', MaxUint256, {
    //     gasPrice: 12 * 1e9,
    // })
    // await tx.wait(1)
    // log(`arrpove MaxUint256 from operator to eth-dispatcher`)

    const addresses = []
    const amounts = []
    const amount = unit.mul(1)
    for (let i = 2500; i < 2600; i++) {
        addresses.push(signers[i].address)
        amounts.push(amount)
        if (addresses.length >= 1000) {
            break
        }
    }

    fs.writeFileSync('shibsc-address-4.json', JSON.stringify(addresses, null, 2))
    tx = await contract.dispatch(tokenAddr, addresses, amounts, {
        gasLimit: 7000000,
        gasPrice: 12 * 1e9,
    })
    let receipt = await tx.wait(1)
    console.log(JSON.stringify(receipt, null, 2))
    console.log(`done`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
