const { fetchTokenInfo } = require('../utils/dex.js')
const { generateCalls, multiCall, HecoMulticallAddress } = require('../utils/multicall')
const { hexToBigNumber } = require('../utils/string')
const { sleep, dateFormat } = require('../utils/util')
const sendToTg = require('../tg/notification')

const log = console.log.bind(console)
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const poolVec = require(__dirname + '/../deploy/deployments/ocean-pools.json')
let lastStaked = {}
const WATCH_INTERVAL_SECONDS = 20

const multiCallGetTvl = async () => {
    const callObjVec = []

    const lpUsdOdt = poolVec[0].tokenAddress
    const OdtTokenInfo = {
        address: '0x991075Cc14A91Fe001528943B3EB6DF31CfF431F',
        decimals: 18,
    }
    const usdTokenInfo = {
        address: '0xa71edc38d189767582c38a3145b5873052c3e47a',
        decimals: 18,
    }
    await fetchTokenInfo(OdtTokenInfo)
    await fetchTokenInfo(usdTokenInfo)

    // ## add multicall
    for (const poolObj of poolVec) {
        // 1. get totalStakedAmount
        callObjVec.push({
            target: poolObj.poolAddress,
            instance: await ethers.getContractAt('NFIUSDTPool', ZERO_ADDRESS),
            functionName: 'totalSupply',
            params: [],
        })

        // 2. get lpTotalSupply from lpInstance
        callObjVec.push({
            target: poolObj.tokenAddress,
            instance: await ethers.getContractAt('MdexPair', ZERO_ADDRESS),
            functionName: 'totalSupply',
            params: [],
        })

        // 3. get the token balance of lpTokenAddress in the tokenInstance
        callObjVec.push({
            target: OdtTokenInfo.address,
            instance: OdtTokenInfo.instance,
            functionName: 'balanceOf',
            params: [poolObj.tokenAddress],
        })
    }

    // 4. get price
    callObjVec.push({
        target: usdTokenInfo.address,
        instance: await ethers.getContractAt('MdexPair', ZERO_ADDRESS),
        functionName: 'balanceOf',
        params: [lpUsdOdt],
    })
    callObjVec.push({
        target: OdtTokenInfo.address,
        instance: await ethers.getContractAt('MdexPair', ZERO_ADDRESS),
        functionName: 'balanceOf',
        params: [lpUsdOdt],
    })

    const { returnData } = await multiCall(
        await generateCalls(callObjVec),
        HecoMulticallAddress,
        true
    )
    const returnDataVec = [...returnData]

    let sumValue = 0
    // ## decode returnData by multicall order
    // - 1. pools
    for (const poolObj of poolVec) {
        const isLp = poolObj.name.endsWith('LP')
        const totalStakedAmount = hexToBigNumber(returnDataVec.shift())
        const lpTotalSupply = hexToBigNumber(returnDataVec.shift())
        const tokenBalanceOfLpAddress = hexToBigNumber(returnDataVec.shift())

        let TVLByTokenValue
        if (isLp) {
            // should double for lp !!!! don't forget
            TVLByTokenValue = totalStakedAmount
                .mul(tokenBalanceOfLpAddress)
                .div(lpTotalSupply)
            TVLByTokenValue = TVLByTokenValue.mul(2)
        } else {
            // single token pool
            TVLByTokenValue = totalStakedAmount
        }

        sumValue = sumValue + TVLByTokenValue / 1e18
    }

    // - 2. get price
    const usdtBalanceOfLpAddress = hexToBigNumber(returnDataVec.shift())
    const tokenBalanceOfLpAddress = hexToBigNumber(returnDataVec.shift())
    const price =
        usdtBalanceOfLpAddress /
        10 ** usdTokenInfo.decimals /
        (tokenBalanceOfLpAddress / 10 ** OdtTokenInfo.decimals)
    const timestamp = hexToBigNumber(returnDataVec[returnDataVec.length - 1])
    const date = new Date(timestamp * 1000)
    const tvl = sumValue * price
    log(
        `${date.toLocaleString()} | Odt price: ${price.toFixed(
            2
        )} | TVL: ${tvl.toFixed(0)} (${getDeltaString(lastTVL, tvl)})`
    )
    lastTVL = tvl
}

const multiCallGetTotalStaked = async () => {
    const callObjVec = []

    const lpUsdOdt = poolVec[0].tokenAddress
    const OdtTokenInfo = {
        address: '0x991075Cc14A91Fe001528943B3EB6DF31CfF431F',
        decimals: 18,
    }
    const usdTokenInfo = {
        address: '0xa71edc38d189767582c38a3145b5873052c3e47a',
        decimals: 18,
    }
    await fetchTokenInfo(OdtTokenInfo)
    await fetchTokenInfo(usdTokenInfo)

    // ## add multicall
    for (const poolObj of poolVec) {
        // 1. get totalStakedAmount
        callObjVec.push({
            target: poolObj.poolAddress,
            instance: await ethers.getContractAt('NFIUSDTPool', ZERO_ADDRESS),
            functionName: 'totalSupply',
            params: [],
        })
    }

    // 4. get price
    callObjVec.push({
        target: usdTokenInfo.address,
        instance: await ethers.getContractAt('MdexPair', ZERO_ADDRESS),
        functionName: 'balanceOf',
        params: [lpUsdOdt],
    })
    callObjVec.push({
        target: OdtTokenInfo.address,
        instance: await ethers.getContractAt('MdexPair', ZERO_ADDRESS),
        functionName: 'balanceOf',
        params: [lpUsdOdt],
    })

    const { returnData } = await multiCall(
        await generateCalls(callObjVec),
        HecoMulticallAddress,
        true
    )
    const returnDataVec = [...returnData]

    // ## decode returnData by multicall order
    // - 1. pools
    const currentStaked = {}
    let totalStakedString = ''
    for (const { name } of poolVec) {
        const isLp = name.endsWith('LP')
        const totalStakedAmount = hexToBigNumber(returnDataVec.shift())
        currentStaked[name] = totalStakedAmount
        const deltaString = `${getDeltaPercentString(
            lastStaked[name],
            totalStakedAmount
        )} / `
        totalStakedString += deltaString
        if (isLp) {
            // should double for lp !!!! don't forget
        } else {
            // single token pool
        }
    }

    // - 2. get price
    const usdtBalanceOfLpAddress = hexToBigNumber(returnDataVec.shift())
    const tokenBalanceOfLpAddress = hexToBigNumber(returnDataVec.shift())
    const price =
        usdtBalanceOfLpAddress /
        10 ** usdTokenInfo.decimals /
        (tokenBalanceOfLpAddress / 10 ** OdtTokenInfo.decimals)
    const timestamp = hexToBigNumber(returnDataVec[returnDataVec.length - 1])
    const date = new Date(timestamp * 1000)
    const fmt = 'YYYY-mm-dd HH:MM:SS'
    // log
    const msg = `${dateFormat(fmt, date)} | Odt price: ${price.toFixed(
        2
    )} | totalStaked: ${totalStakedString}`
    log(msg)
    await sendToTg(msg)
    lastStaked = currentStaked
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
            await sleep(WATCH_INTERVAL_SECONDS)
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
