const {sleep, dateFormat} = require('../utils/util')
const sendToTg = require('../tg/notification')
const axios = require('axios');

const log = console.log.bind(console)
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

// 60 minutes
const Interval_Seconds = 60 * 60

// 30s
const Interval_Seconds_Error = 30

let storage, lastHolders

// pancake
const targetTokenInfo = {
    address: '0xdf0816cc717216c8b0863af8d4f0fc20bc65d643',
    decimals: 18,
}

// busd
const usdTokenInfo = {
    address: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
    decimals: 18,
}

// WBNB
const wethTokenInfo = {
    address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
    decimals: 18,
}

const lpTargetWETHAddress = '0x0b85ddf1921ab0efbfabd0b178b90f64ea2b11d3'
const lpWETHBUSDAddress = '0x1b96b92314c44b159149f7e0303511fb2fc4774f'

const init = async () => {
    storage = await ethers.getContractAt(
        'SimpleStorage',
        '0x342DC0f976247570550B70372e5b43D4fB5Cb71e'
    )
    lastHolders = 0
}


const extractHoldersFromData = (data) => {
    const index = data.indexOf('number of holders')
    const end = data.indexOf('and', index)
    const str = data.substr(index + 18, end - index - 17)
    return parseInt(str.replace(',', ''))
}

const getHoldersFromBSCScan = async () => {
    const url = 'https://bscscan.com/token/0xdf0816cc717216c8b0863af8d4f0fc20bc65d643'

    return axios.get(url)
        .then(resp => {
            return extractHoldersFromData(resp.data)
        })
}

const setHoldersToStorage = async (holders) => {
    const tx = await storage.setHolders(holders)
    await tx.wait(1)
}

const main = async () => {
    await init()

    while (true) {
        try {
            const holders = await getHoldersFromBSCScan()
            if (holders) {
                log(`holders`, holders, 'lastHolders: ', lastHolders)
                if (holders > lastHolders) {
                    await setHoldersToStorage(holders)
                    log(`setHoldersToStorage success`)
                }
                await sendToTg(`Holders: ${holders}`)
            } else {
                log("request to BSCScan error")
                throw "request to BSCScan error"
            }
            await sleep(Interval_Seconds)
        } catch (e) {
            const msg = `----error: ${e}, restart after 60s`
            await sendToTg(msg)
            log(msg)
            await sleep(Interval_Seconds_Error)
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
