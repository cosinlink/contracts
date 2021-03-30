const { sleep, dateFormat } = require('../utils/util')
const sendToTg = require('../tg/notification')
const newwInfo = require('./NEWWPresale.json')
const log = console.log.bind(console)

// 1 hour = 3600s
// const drawInterval = 3600 - 10
const drawInterval = 3600 * 3 - 10
// const drawInterval = 300 // 5 min
// const lotteryContractAddress = '0x705de7220CD56E75D080df9ad2F88B94051Fb5AD'
// const lotteryContractAddress = '0xB4dBa35b926Dd3D1155618142d754dB5a3Ba5efc'
const presaleAddress = '0x90eFdDFedf7c3B3C6E3932c5653476334f7638b6'
let userAddress
let presale

const sendToODTLotteryMonitor = async (msg) => {
    await sendToTg(msg, 'ODT_LOTTERY_MONITOR')
}

const init = async () => {
    // !!! don't forget bsc network
    // 0x326fBFcc3DbaC94Ed7d4B42193b58293785a2971
    let [userTestUsdt] = await ethers.getSigners()
    log(`init, userTestUsdt.address: `, userTestUsdt.address)
    userAddress = userTestUsdt.address
    presale = await ethers.getContractAt(
        newwInfo.abi,
        presaleAddress,
        userTestUsdt
    )
}

const buyTokens = async () => {
    let tx, receipt, msg
    const unit = ethers.constants.WeiPerEther
    const buyBnBAmount = unit.mul(143)
    // const buyBnBAmount = unit.div(10)
    log(`amount`, buyBnBAmount)

    // 1. enterDrawingPhase
    // tx = await presale.populateTransaction['buyTokens'](userAddress, { value: buyBnBAmount, gasPrice: 50 * 1e9, gasLimit: 9000000 })
    // log(`tx: `)
    // return log(tx)

    tx = await presale.buyTokens(userAddress, {
        value: buyBnBAmount,
        gasPrice: 120 * 1e9,
        gasLimit: 2000000
    })
    log(`buytokens tx:`)
    log(tx)
    receipt = await tx.wait(0)
    return {tx, receipt}
}

const main = async () => {

    await init()
    while (1) {
        try {
            const {tx} = await buyTokens()
            log(tx)
            log(`buyTokens success!!!`)
            break
        } catch (e) {
            const waitSeconds = 1
            const msg = `!!!!!buyTokens error: ${e}, restart after ${waitSeconds}s`
            log(msg)
            await sleep(waitSeconds)
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
