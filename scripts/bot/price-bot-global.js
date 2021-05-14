const { fetchTokenInfo } = require('../utils/dex.js')
const { generateCalls, multiCall, BSCMulticallAddress } = require('../utils/multicall')
const { hexToBigNumber } = require('../utils/string')
const { sleep, dateFormat } = require('../utils/util')
const sendToTg = require('../tg/notification')

const log = console.log.bind(console)
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
let lastPrice = {}
const IntervalTimes = 6 * 60
let currentInterval = 0

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

const multiCallGetTotalStaked = async () => {
    const callObjVec = []

    await fetchTokenInfo(targetTokenInfo)
    await fetchTokenInfo(wethTokenInfo)
    await fetchTokenInfo(usdTokenInfo)

    // ## add multicall
    // 4. get price
    callObjVec.push({
        target: wethTokenInfo.address,
        instance: await ethers.getContractAt('MdexPair', ZERO_ADDRESS),
        functionName: 'balanceOf',
        params: [lpTargetWETHAddress],
    })
    callObjVec.push({
        target: targetTokenInfo.address,
        instance: await ethers.getContractAt('MdexPair', ZERO_ADDRESS),
        functionName: 'balanceOf',
        params: [lpTargetWETHAddress],
    })


    callObjVec.push({
        target: usdTokenInfo.address,
        instance: await ethers.getContractAt('MdexPair', ZERO_ADDRESS),
        functionName: 'balanceOf',
        params: [lpWETHBUSDAddress],
    })
    callObjVec.push({
        target: wethTokenInfo.address,
        instance: await ethers.getContractAt('MdexPair', ZERO_ADDRESS),
        functionName: 'balanceOf',
        params: [lpWETHBUSDAddress],
    })

    const { returnData } = await multiCall(
        await generateCalls(callObjVec),
        BSCMulticallAddress,
        true
    )
    const returnDataVec = [...returnData]

    // ## decode returnData by multicall order
    // - 1. get target-weth price
    const wethBalanceOfLpAddress = hexToBigNumber(returnDataVec.shift())
    const targetBalanceOfLpAddress = hexToBigNumber(returnDataVec.shift())
    const price1 =
        (wethBalanceOfLpAddress / 10 ** wethTokenInfo.decimals) /
        (targetBalanceOfLpAddress / 10 ** targetTokenInfo.decimals)

    // - 2. get weth-busd price
    const usdtBalanceOfLp2Address = hexToBigNumber(returnDataVec.shift())
    const wethBalanceOfLp2Address = hexToBigNumber(returnDataVec.shift())

    log(usdtBalanceOfLp2Address, wethBalanceOfLp2Address)
    const price2 =
        (usdtBalanceOfLp2Address) /
        (wethBalanceOfLp2Address)

    const price = price1 * price2

    const timestamp = hexToBigNumber(returnDataVec[returnDataVec.length - 1])
    const date = new Date(timestamp * 1000)
    const fmt = 'YYYY-mm-dd HH:MM:SS'

    let percentString = ''
    if (lastPrice) {
        const delta = price - lastPrice
        const percent = (Math.abs(delta) / lastPrice) * 100
        if (percent < 5 && currentInterval < IntervalTimes) {
            currentInterval++
            return
        }
        currentInterval = 0

        if (delta < 0) {
            percentString = `-${percent.toFixed(4)}%`
        } else {
            percentString = `+${percent.toFixed(4)}%`
        }
    }

    // log
    const msg = `${dateFormat(fmt, date)} | SHIBSC-BUSD price: ${price.toFixed(
        11
    )} | ${percentString}`
    log(msg)
    await sendToTg(msg, 'GLOBAL')
    lastPrice = price
}

function getDeltaString(lastTVL, tvl) {
    if (!lastTVL) {
        return ''
    }

    const delta = tvl - lastTVL
    const percent = (Math.abs(delta) / lastTVL) * 100
    if (delta < 0) {
        return `-${percent.toFixed(4)}% / ${(delta / 10000).toFixed(4)}W`
    }

    return `+${percent.toFixed(4)}% / +${(delta / 10000).toFixed(4)}W`
}

function getDeltaPercentString(lastTVL, tvl) {
    if (!lastTVL) {
        return ''
    }

    const delta = tvl - lastTVL
    const percent = (Math.abs(delta) / lastTVL) * 100
    if (delta < 0) {
        return `!!!!-*${percent.toFixed(4)}%*`
    } else if (percent <= 0.0001) {
        return `-`
    }

    return `+${percent.toFixed(4)}%`
}

const main = async () => {
    while (true) {
        try {
            // await multiCallGetTvl()
            await multiCallGetTotalStaked()
            await sleep(10)
        } catch (e) {
            const msg = `----error: ${e}, restart after 30s`
            await sendToTg(msg)
            log(msg)
            await sleep(30)
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
