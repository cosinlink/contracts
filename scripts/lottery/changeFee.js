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
const lotteryContractAddress = '0xD398808f5370bBcCe3ADB5B68a3B2718F3454384'
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

const main = async () => {
    // 1. get lottery contract interface
    // 2. set lotteryOperator
    await init()

    const tx = await lottery.changeClaimFee(ethers.utils.parseEther('0.02'));
    await tx.wait(1)

    let msg = `----------- change fee to 0.02 -----------`
    log(msg)
    await sendToODTLotteryMonitor(msg)
    await sleep(drawInterval)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
