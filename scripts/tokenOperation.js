const log = console.log.bind(console)
const contractFactoryPath = 'contracts/mainnet/MdxToken.sol:MdxToken' // just use its api
const contractAddress = '0x09529f0281a749ec3f447944e73ca92a38679761' // book

async function main() {
    log('main')
    const instance = await ethers.getContractAt(
        contractFactoryPath,
        contractAddress
    )

    let recieptAddr = '0x92531122B728cbEd7FDA325Ac8690A9681684C04'
    let amount = 111
    let res = await instance.transfer(recieptAddr, amount)
    await res.wait(1)
    log('transfer success')
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
