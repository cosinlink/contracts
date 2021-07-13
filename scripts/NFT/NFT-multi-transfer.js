const fs = require('fs')
const addrList = []
const log = console.log.bind(console)
const NFTDispatcherAddress = '0xd05B804E1bB59717DF8F491Ab06537Af232C7037'
const main = async () => {
    const unit = ethers.constants.WeiPerEther

    let signers = await ethers.getSigners()
    const operator = signers[0]
    log(`operator : `, operator.address)

    let contract = await ethers.getContractAt(
        'NFTDispatcher',
        NFTDispatcherAddress
    )

    const NFTCakeAddr = "0x6a2dfb87f5923a0d6ad8e5127ed001cde29fe77a"
    const NFTBryAddr = "0x6a2dfb87f5923a0d6ad8e5127ed001cde29fe77a"

    let tokenContractCake = await ethers.getContractAt(
        'Tuha',
        NFTCakeAddr
    )
    let tokenContractBry = await ethers.getContractAt(
        'Tuha',
        NFTBryAddr
    )
    let MaxUint256 = ethers.constants.MaxUint256
    let tx
    // tx = await tokenContractCake.setApprovalForAll(NFTDispatcherAddress, true, {
    //     gasPrice: 6 * 1e9,
    // })
    // await tx.wait(1)
    // log(`NFTCake: setApprovalForAll to NFTDispatcherAddress`)
    //
    // tx = await tokenContractBry.setApprovalForAll(NFTDispatcherAddress, true, {
    //     gasPrice: 6 * 1e9,
    // })
    // await tx.wait(1)
    // log(`NFTBry: setApprovalForAll to NFTDispatcherAddress`)


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

    fs.writeFileSync('shibsc-address-800-test.json', JSON.stringify(addresses, null, 2))
    tx = await contract.dispatch(tokenAddr, addresses, amounts, {
        gasLimit: 60000000,
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
