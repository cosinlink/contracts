const { sleep, dateFormat } = require('../utils/util')
const sendToTg = require('../tg/notification')
const lotteryInfo = require('./Lottery-v2.json')
const log = console.log.bind(console)


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

    const tx = await lottery.changeClaimFee(ethers.utils.parseEther('0.004'));
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
