async function main() {
    const unit = ethers.constants.WeiPerEther

    let tx
    console.log('network: ' + network.name)
    let [operator] = await ethers.getSigners()
    let storage = await ethers.getContractAt(
        'SimpleStorage',
        '0x342DC0f976247570550B70372e5b43D4fB5Cb71e'
    )

    tx = await storage.setHolders(123)
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
