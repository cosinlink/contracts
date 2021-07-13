const fs = require('fs')
const readline = require('readline');

const addrList = []
const log = console.log.bind(console)
const NFTDispatcherAddress = '0xd05B804E1bB59717DF8F491Ab06537Af232C7037'

const getAddressesFromTxt = async () => {
    const addresses = []
    const filename = __dirname + '/' + 'tuha-nft-addresses.csv'

    const fileStream = fs.createReadStream(filename);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    // Note: we use the crlfDelay option to recognize all instances of CR LF
    // ('\r\n') in input.txt as a single line break.

    for await (const line of rl) {
        if (line.length === 42) {
            // Each line in input.txt will be successively available here as `line`.\
            addresses.push(line)
        }
    }
    return addresses;
}


const main = async () => {
    const addressList = await getAddressesFromTxt()
    log(addressList)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
