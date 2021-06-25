async function main() {
    const unit = ethers.constants.WeiPerEther

    let tx
    console.log('network: ' + network.name)
    let [operator] = await ethers.getSigners()
    let contract = await ethers.getContractAt(
        'CryptExLpTokenLockerV2',
        '0xba34106e448bDEE8020ce17E69f4CFa82507D294'
    )

    const token = '0x8076c74c5e3f5852037f31ff0093eeb8c8add8d3'
    const amount = 20000
    const unlockTime = 1623781371
    const withdrawer = operator.address

    tx = await contract.lockTokens(
        token,
        amount,
        unlockTime,
        withdrawer
    )
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
