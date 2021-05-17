const { fetchTokenInfo } = require('../utils/dex.js')
const { generateCalls, multiCall, BSCMulticallAddress } = require('../utils/multicall')
const { hexToBigNumber } = require('../utils/string')
const { sleep, dateFormat } = require('../utils/util')
const sendToAddrTg = require('../tg/addr-notification')
const fs = require('fs')
const readline = require('readline');

const log = console.log.bind(console)
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
let lastPrice = {}
const Interval_Seconds = 120
const SCOUT_ADDRESS = '0x1e2b7ae4f142fe8364114bdf6ffee18b1effe595'
let last_scout_balance = 0

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

const getAddressesFromTxt = async () => {
    const addresses = []
    const filename = __dirname + '/' + 't.txt'

    const fileStream = fs.createReadStream(filename);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    // Note: we use the crlfDelay option to recognize all instances of CR LF
    // ('\r\n') in input.txt as a single line break.

    for await (const line of rl) {
        if (line.length === 42) {
            // Each line in input.txt will be successively available here as `line`.\
            addresses.push(line)
        }
    }
    return addresses;
}

const multiCallGetBalance = async () => {
    const callObjVec = []

    await fetchTokenInfo(targetTokenInfo)
    await fetchTokenInfo(wethTokenInfo)
    await fetchTokenInfo(usdTokenInfo)

    // ## add multicall
    // 1. get target-bnb price
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

    // 2. get Scout target balance
    callObjVec.push({
        target: targetTokenInfo.address,
        instance: await ethers.getContractAt('MdexPair', ZERO_ADDRESS),
        functionName: 'balanceOf',
        params: [SCOUT_ADDRESS],
    })

    // 3. get address list target balance
    const addresses = await getAddressesFromTxt()
    for (let i = 0; i < addresses.length; i++) {
        callObjVec.push({
            target: targetTokenInfo.address,
            instance: await ethers.getContractAt('MdexPair', ZERO_ADDRESS),
            functionName: 'balanceOf',
            params: [addresses[i]],
        })
    }

    // 4. get address list eth balance
    for (let i = 0; i < addresses.length; i++) {
        callObjVec.push({
            target: BSCMulticallAddress,
            instance: await ethers.getContractAt('Multicall', ZERO_ADDRESS),
            functionName: 'getEthBalance',
            params: [addresses[i]],
        })
    }

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
    const price =
        (wethBalanceOfLpAddress / 10 ** wethTokenInfo.decimals) /
        (targetBalanceOfLpAddress / 10 ** targetTokenInfo.decimals)
    lastPrice = price

    // - 2. get scout balance
    const scout_balance = hexToBigNumber(returnDataVec.shift())

    // -3. get list addresses target balance
    const balancesTarget = []
    let sumTarget
    for (let i = 0; i < addresses.length; i++) {
        const balance = hexToBigNumber(returnDataVec.shift())
        balancesTarget.push(balance)
        if (!sumTarget) {
            sumTarget = balance
        } else {
            sumTarget = sumTarget.add(balance)
        }
    }

    // -4. get list addresses eth balance
    const balancesETH = []
    let sumETH
    for (let i = 0; i < addresses.length; i++) {
        const balance = hexToBigNumber(returnDataVec.shift())
        balancesETH.push(balance)
        if (!sumETH) {
            sumETH = balance
        } else {
            sumETH = sumETH.add(balance)
        }
    }

    const timestamp = hexToBigNumber(returnDataVec[returnDataVec.length - 1])
    const date = new Date(timestamp * 1000)
    const fmt = 'YYYY-mm-dd HH:MM:SS'

    // 1. SCOUT
    let msg
    if (scout_balance >= last_scout_balance) {
        msg = `${dateFormat(fmt, date)}
The Big Address(${SCOUT_ADDRESS}) No Operation`
    } else {
        msg = `${dateFormat(fmt, date)} 
The Big Address(${SCOUT_ADDRESS}) is Changed !!!!!!!!!!!!! @CC_SHIT`
    }

    if (scout_balance / 1e18 < 4638149905667) {
        msg = `~~~~~~~~~~~~~~~~~~~~~~~~~~~~~(${SCOUT_ADDRESS}) have Sold Some ERC20~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~` + msg
        msg = `~~~~~~~~~~~~~~~~~~~~~~~~~~~~~(${SCOUT_ADDRESS}) have Sold Some ERC20~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~` + msg
        msg = `~~~~~~~~~~~~~~~~~~~~~~~~~~~~~(${SCOUT_ADDRESS}) have Sold Some ERC20~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~` + msg
    }

    msg += `\r\n`
    msg += `\r\n`

    last_scout_balance = scout_balance

    // 2. SUM Balance
    msg += `Sum ERC20 = ${sumTarget / 1e18.toFixed(2)} = ${sumTarget * price / 1e18.toFixed(4)}
Sum BNB = ${sumETH / 1e18.toFixed(2)}`
    msg += `\r\n`
    msg += `\r\n`

    // 3. First 10 address of  Target Token
    const objArr = []
    for (let i = 0; i < addresses.length; i++) {
        objArr.push({
            address: addresses[i],
            eth: balancesETH[i],
            target: balancesTarget[i],
        })
    }
    objArr.sort((a, b) => b.target - a.target)
    for (let i = 0; i < 10; i++) {
        msg += `${i+1}. ${objArr[i].address}`
        msg += `\r\n`
    }
    msg += `\r\n`
    log(msg)
    await sendToAddrTg(msg, "SECRET")
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
            await multiCallGetBalance()
            await sleep(Interval_Seconds)
        } catch (e) {
            const msg = `----error: ${e}, restart after 30s`
            await sendToAddrTg(msg, "SECRET")
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
