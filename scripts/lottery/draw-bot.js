const { sleep, dateFormat } = require('../utils/util')
const sendToTg = require('../tg/notification')
const lotteryInfo = require('./Lottery.json')
const log = console.log.bind(console)

// 1 hour = 3600s
// const drawInterval = 3600
const drawInterval = 300 // 5 min
const lotteryContractAddress = '0xf719E21cF43457086A87Ec19E5A8A560970bB6b0'
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
    await sendToODTLotteryMonitor(msg)
}

const drawed = async () => {
    let tx, receipt, msg

    // 2. drawed, random 123
    tx = await lottery.drawing(123)
    receipt = await tx.wait(1)
    msg = `drawed, receipt.transactionHash: ${receipt.transactionHash},  status: ${receipt.status}`
    log(msg)
    await sendToODTLotteryMonitor(msg)
}

const reset = async () => {
    let tx, receipt, msg

    // 3.
    tx = await lottery.reset()
    receipt = await tx.wait(1)
    msg = `reset, receipt.transactionHash: ${receipt.transactionHash},  status: ${receipt.status}`
    log(msg)
    await sendToODTLotteryMonitor(msg)
}

const main = async () => {
    // 1. get lottery contract interface
    // 2. set lotteryOperator
    await init()

    while (1) {
        while (1) {
            try {
                await enterDraw()
                break
            } catch (e) {
                const msg = `!!!!!enterDraw error: ${e}, restart after 30s`
                await sendToODTLotteryMonitor(msg)
                log(msg)
                await sleep(30)
            }
        }

        while (1) {
            try {
                await drawed()
                break
            } catch (e) {
                const msg = `!!!!!drawed error: ${e}, restart after 30s`
                await sendToODTLotteryMonitor(msg)
                log(msg)
                await sleep(30)
            }
        }

        while (1) {
            try {
                await reset()
                break
            } catch (e) {
                const msg = `!!!!!reset error: ${e}, restart after 30s`
                await sendToODTLotteryMonitor(msg)
                log(msg)
                await sleep(30)
            }
        }

        const msg = `-----------sleep ${drawInterval} seconds, waiting for next round-----------`
        log(msg)
        await sendToODTLotteryMonitor(msg)
        await sleep(drawInterval)
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
