const { sleep, dateFormat } = require('../utils/util')
const sendToTg = require('../tg/notification')
const lotteryInfo = require('./Lottery.json')
const log = console.log.bind(console)

// 1 hour = 3600s
// const drawInterval = 3600
const drawInterval = 300 // 5 min
// const lotteryContractAddress = '0xaBbA5Ba71f5FcaE961705e012d5DA3B7B7F9Ccef'
const lotteryContractAddress = '0xB4dBa35b926Dd3D1155618142d754dB5a3Ba5efc'
// const lotteryContractAddress = '0x4491146B926bf561993950376e9ac7CBd4eC622d'
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

const enterDraw = async () => {
    let tx, receipt, msg

    // 1. enterDrawingPhase
    tx = await lottery.enterDrawingPhase()
    receipt = await tx.wait(1)
    msg = `enterDrawingPhase, receipt.transactionHash: ${receipt.transactionHash},  status: ${receipt.status}`
    log(msg)
    // await sendToODTLotteryMonitor(msg)
}

const drawed = async () => {
    let tx, receipt, msg

    // 2. drawed, random 123
    tx = await lottery.drawing(123)
    receipt = await tx.wait(1)
    msg = `drawed, receipt.transactionHash: ${receipt.transactionHash},  status: ${receipt.status}`
    log(msg)
    // await sendToODTLotteryMonitor(msg)
}

const main = async () => {
    // 1. get lottery contract interface
    // 2. set lotteryOperator
    await init()
    await enterDraw()
    await drawed()
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
