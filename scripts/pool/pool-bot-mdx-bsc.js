const { fetchTokenInfo } = require('../utils/dex.js')
const { generateCalls, multiCall, BSCMulticallAddress } = require('../utils/multicall')
const { hexToBigNumber } = require('../utils/string')
const { sleep, dateFormat } = require('../utils/util')
const sendToTg = require('../tg/notification')

const log = console.log.bind(console)
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const WATCH_INTERVAL_SECONDS = 3
const MDX_BSC_ADDRESS = '0x9c65ab58d8d978db963e63f2bfb7121627e3a739'
const BUSD_BSC_ADDRESS = '0xe9e7cea3dedca5984780bafc599bd69add087d56'
const MDX_BUSD_LP_BSC_ADDRESS = '0x223740a259e461abee12d84a9fff5da69ff071dd'
const LP_POOL = '0xc48FE252Aa631017dF253578B1405ea399728A50'
const LP_POOL_PID = 40
const poolVec = [{
    tokenAddress: MDX_BUSD_LP_BSC_ADDRESS,
    poolAddress: LP_POOL
}]

const multiCallGetTotalStaked = async () => {
    const callObjVec = []

    const lpUsdMdx = poolVec[0].tokenAddress
    const MdxTokenInfo = {
        address: MDX_BSC_ADDRESS,
        decimals: 18,
    }
    const usdTokenInfo = {
        address: BUSD_BSC_ADDRESS,
        decimals: 18,
    }
    await fetchTokenInfo(MdxTokenInfo)
    await fetchTokenInfo(usdTokenInfo)

    // ## add multicall
    // 4. get price
    callObjVec.push({
        target: usdTokenInfo.address,
        instance: await ethers.getContractAt('MdexPair', ZERO_ADDRESS),
        functionName: 'balanceOf',
        params: [lpUsdMdx],
    })
    callObjVec.push({
        target: MdxTokenInfo.address,
        instance: await ethers.getContractAt('MdexPair', ZERO_ADDRESS),
        functionName: 'balanceOf',
        params: [lpUsdMdx],
    })

    const { returnData } = await multiCall(
        await generateCalls(callObjVec),
        BSCMulticallAddress,
        true
    )
    const returnDataVec = [...returnData]

    // ## decode returnData by multicall order
    // - 2. get price
    const usdtBalanceOfLpAddress = hexToBigNumber(returnDataVec.shift())
    const tokenBalanceOfLpAddress = hexToBigNumber(returnDataVec.shift())
    const price =
        usdtBalanceOfLpAddress /
        10 ** usdTokenInfo.decimals /
        (tokenBalanceOfLpAddress / 10 ** MdxTokenInfo.decimals)
    const timestamp = hexToBigNumber(returnDataVec[returnDataVec.length - 1])
    const date = new Date(timestamp * 1000)
    const fmt = 'YYYY-mm-dd HH:MM:SS'
    // log
    const msg = `${dateFormat(fmt, date)} | BSC: Mdx price: ${price.toFixed(
        2
    )}`
    log(msg)
    await sendToTg(msg)
}

const main = async () => {
    while (true) {
        try {
            // await multiCallGetTvl()
            await multiCallGetTotalStaked()
            await sleep(WATCH_INTERVAL_SECONDS)
        } catch (e) {
            const msg = `----error: ${e}, restart after 30s`
            // await sendToTg(msg)
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
