const { sleep, dateFormat } = require('../utils/util')
const sendToTg = require('../tg/notification')
const lotteryInfo = require('./Lottery-v2.json')
const log = console.log.bind(console)

// 1 hour = 3600s
// const drawInterval = 3600 - 10
const drawInterval = 3600 * 3 - 10
// const drawInterval = 300 // 5 min
// const lotteryContractAddress = '0x705de7220CD56E75D080df9ad2F88B94051Fb5AD'
// const lotteryContractAddress = '0xB4dBa35b926Dd3D1155618142d754dB5a3Ba5efc'
// const lotteryContractAddress = '0xfDF9b7Fe20c0D8a7aD8A8aa2C422BCEBc0cE8360'
// v2
const lotteryContractAddress = '0x274dd92aeE8A567C9650aa099830dBb635996966'
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

const oneClickDraw = async () => {
    let tx, receipt, msg

    // 1. enterDrawingPhase
    tx = await lottery.oneClickDraw(123)
    receipt = await tx.wait(1)
}

const main = async () => {
    // 1. get lottery contract interface
    // 2. set lotteryOperator
    await init()

    while (1) {
        while (1) {
            try {
                await oneClickDraw()
                break
            } catch (e) {
                const msg = `!!!!!oneClickDraw error: ${e}, restart after 30s`
                log(msg)
                await sleep(30)
            }
        }

        let msg = `----------- oneClickDraw success!
sleep ${drawInterval} seconds, waiting for next round-----------`
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
