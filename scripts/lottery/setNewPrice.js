const { sleep, dateFormat } = require('../utils/util')
const sendToTg = require('../tg/notification')
const lotteryInfo = require('./Lottery.json')
const log = console.log.bind(console)

// 1 hour = 3600s
// const drawInterval = 3600
const drawInterval = 300 // 5 min
// const lotteryContractAddress = '0xaBbA5Ba71f5FcaE961705e012d5DA3B7B7F9Ccef'
const lotteryContractAddress = '0xB4dBa35b926Dd3D1155618142d754dB5a3Ba5efc'
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

const getTicketPrice = async () => {
    let tx, receipt, msg, res

    // 1. enterDrawingPhase
    res = await lottery.callStatic.ticketPrice()
    msg = `ticketPrice: ${res}`
    log(msg)
}

const main = async () => {
    // 1. get lottery contract interface
    // 2. set lotteryOperator
    await init()
    await getTicketPrice()
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
