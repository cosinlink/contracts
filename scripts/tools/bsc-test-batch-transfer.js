const fs = require('fs')
const addrList = []
const log = console.log.bind(console)
const dispatcherAddr = '0x1A67e1c17d1140Ce51BB26b4E77fE031E8df71de'
const tokenAddr = "0xc46912C1F166BE114dd259B1AEDb4232A1D67fC3"

const main = async () => {

    const unit = ethers.constants.WeiPerEther
    let signers = await ethers.getSigners()
    const operator = signers[0]

    log(`operator : `, operator.address)

    let contract = await ethers.getContractAt(
        'EthDispatcher',
        dispatcherAddr
    )
    let tokenContract = await ethers.getContractAt(
        'MdexPair',
        tokenAddr
    )
    let MaxUint256 = ethers.constants.MaxUint256
    let tx
    tx = await tokenContract.approve(dispatcherAddr, MaxUint256, {
        gasPrice: 12 * 1e9,
    })
    await tx.wait(1)
    log(`arrpove MaxUint256 from operator to eth-dispatcher`)

    const addresses = []
    const amounts = []
    const amount = unit.mul(1)
    for (let i = 5000; i < 5800; i++) {
        addresses.push(signers[i].address)
        amounts.push(amount)
        if (addresses.length >= 1000) {
            break
        }
    }

    fs.writeFileSync('shibsc-test-address-800-test.json', JSON.stringify(addresses, null, 2))
    log('dispatch length: ', addresses.length, 'begin dispatch!')

    tx = await contract.dispatch(tokenAddr, addresses, amounts, {
        gasLimit: 29000000,
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
