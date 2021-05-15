async function main() {
    const unit = ethers.constants.WeiPerEther

    let tx
    console.log('network: ' + network.name)
    let [operator] = await ethers.getSigners()
    let storage = await ethers.getContractAt(
        'SimpleStorage',
        '0x342DC0f976247570550B70372e5b43D4fB5Cb71e'
    )

    const holders = await storage.staticCall.getHolders()
    console.log(`holders: `, holders)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
