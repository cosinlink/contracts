const { sleep, dateFormat } = require('../utils/util')
const sendToTg = require('../tg/notification')
const lotteryInfo = require('./Lottery.json')
const log = console.log.bind(console)

// 1 hour = 3600s
// const drawInterval = 3600
const drawInterval = 300 // 5 min
// const lotteryContractAddress = '0xaBbA5Ba71f5FcaE961705e012d5DA3B7B7F9Ccef'
// const lotteryContractAddress = '0xB4dBa35b926Dd3D1155618142d754dB5a3Ba5efc'
const lotteryContractAddress = '0x4491146B926bf561993950376e9ac7CBd4eC622d'
let lottery

const sendToODTLotteryMonitor = async (msg) => {
    await sendToTg(msg, 'ODT_LOTTERY_MONITOR')
}

const init = async () => {
    // !!! don't forget heco-lottery network
    // 0x326fBFcc3DbaC94Ed7d4B42193b58293785a2971
    let [lotteryOperator] = await ethers.getSigners()
    log(`init, lotteryOperator.address: `, lotteryOperator.address)
    lottery = await ethers.getContractAt(
        lotteryInfo.abi,
        lotteryContractAddress,
        lotteryOperator
    )
}

const setTicketPrice = async () => {
    let tx, receipt, msg, res

    const unit = ethers.constants.WeiPerEther
    const price = unit.mul(1)
    log('price: ', price.toString())

    // 1. enterDrawingPhase
    res = await lottery.setTicketPrice(price)
    await res.wait(1)
    msg = `set new ticketPrice: ${price}`
    log(msg)
}

const main = async () => {
    // 1. get lottery contract interface
    // 2. set lotteryOperator
    await init()
    await setTicketPrice()
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
