const { getTokenPrice, fetchPoolInfo, fetchTokenInfo } = require('./dex.js')
const { calcPoolTotalTokenValue, calcPoolsTVL } = require('./pool.js')
const { generateCalls, multiCall } = require('./multicall')
const { hexToBigNumber } = require('./string')

const log = console.log.bind(console)
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const poolVec = [
    {
        name: 'HBO-USDT-LP',
        tokenAddress: '0xc189c6c138e78e8a4c1f1633e4c402e0c49a6049',
        poolAddress: '0x7565a0a69156549c8e1eb2c219458018c3aaf196',
        value: '',
    },
    {
        name: 'HBO-HBTC-LP',
        tokenAddress: '0xa6e787c0efc68c9a400db05e7764ff2d224c4f6a',
        poolAddress: '0xe43dE0a82e4229eC05b629E4656561903029ADef',
        value: '',
    },
    {
        name: 'HBO-HT-LP',
        tokenAddress: '0x235d09d666fb95ea422ef8d3523936a6140b20bb',
        poolAddress: '0xc3c59D153612166aC5ae10EBd643467363dDc1F0',
        value: '',
    },
    {
        name: 'HBO-HUSD-LP',
        tokenAddress: '0x2eb1efe826c462105adf724f8307416d605e40a7',
        poolAddress: '0xb8dD7B1b69B17492e1d26a46aF00366088F36e32',
        value: '',
    },
    {
        name: 'HBO',
        tokenAddress: '0x8764bd4fcc027faf72ba83c0b2028a3bae0d2d57',
        poolAddress: '0x0f1228dfb46a92825858ec417db7fb3b542c1df8',
        value: '',
    },
]

const test1 = async () => {
    const usdTokenInfo = {
        address: '0xa71edc38d189767582c38a3145b5873052c3e47a',
        decimals: 18,
    }

    const hboTokenInfo = {
        address: '0x8764bd4fcc027faf72ba83c0b2028a3bae0d2d57',
        decimals: 18,
    }

    const tokenPriceInfo = await getTokenPrice(
        '0xc189c6c138e78e8a4c1f1633e4c402e0c49a6049',
        usdTokenInfo,
        hboTokenInfo
    )

    log(
        `${hboTokenInfo.symbol}/${
            usdTokenInfo.symbol
        } Price: ${tokenPriceInfo.price.toFixed(4)}`
    )
    log(
        `${tokenPriceInfo.balanceUsdToken / 10 ** usdTokenInfo.decimals}, ${
            tokenPriceInfo.balanceToken / 10 ** hboTokenInfo.decimals
        }, ${tokenPriceInfo.lpTotalValue / 1e18}`
    )
}

const test2 = async () => {
    const signers = await ethers.getSigners()
    const users = signers.map((signerWithAddress) => signerWithAddress.address)
    log(users)
}

const test3 = async () => {
    const lpUsdtHbo = '0xc189c6c138e78e8a4c1f1633e4c402e0c49a6049'

    const tvl = await calcPoolsTVL(
        poolVec,
        lpUsdtHbo,
        {
            address: '0x8764bd4fcc027faf72ba83c0b2028a3bae0d2d57',
            decimals: 18,
        },
        {
            address: '0xa71edc38d189767582c38a3145b5873052c3e47a',
            decimals: 18,
        }
    )
    log('tvl: ', tvl)
}

const test4 = async () => {
    for (const poolObj of poolVec) {
        const poolInfo = await fetchPoolInfo({
            address: poolObj.poolAddress,
        })
        const rewardRate = await poolInfo.instance.callStatic.rewardRate()
        log(poolObj.name, 'rewardRate: ', rewardRate.toString())
        log('rewardRate * 1 days: ', (rewardRate / 1e18) * 24 * 3600)
    }
}

const testGenerateCalls = async () => {
    const callObjVec = [
        {
            target: '0xa71edc38d189767582c38a3145b5873052c3e47a',
            instance: await ethers.getContractAt(
                'MdexPair',
                '0xa71edc38d189767582c38a3145b5873052c3e47a'
            ),
            functionName: 'balanceOf',
            params: ['0x0000000000000000000000000000000000000000'],
        },
    ]

    const calls = await generateCalls(callObjVec)
    const res = await multiCall(calls)
    log(res)
    log(ethers.BigNumber.from(res.returnData[0]) / (1e18).toString())
}

const testMultiCall = async () => {
    const poolInstance = await ethers.getContractAt(
        'NFIUSDTPool',
        '0x0000000000000000000000000000000000000000'
    )

    /*
     *   @dev other way to generate calldata
     *    let ABI = [
     *        "function totalSupply()"
     *    ]
     *    let iface = new ethers.utils.Interface(ABI);
     *    log(`calldata: `, iface.encodeFunctionData("totalSupply"))=
     * */
    const tx = await poolInstance.populateTransaction.balanceOf(
        '0x0000000000000000000000000000000000000000'
    )
    const callObj = {
        target: '0x7565a0a69156549c8e1eb2c219458018c3aaf196', // contract address to call
        callData: tx.data, //
    }

    let res = await multiCall([callObj])
    log(ethers.BigNumber.from(res.returnData[0]) / (1e18).toString())
}

const multiCallGetTvl = async () => {
    const callObjVec = []

    const lpUsdHbo = poolVec[0].tokenAddress
    const hboTokenInfo = {
        address: '0x8764bd4fcc027faf72ba83c0b2028a3bae0d2d57',
        decimals: 18,
    }
    const usdTokenInfo = {
        address: '0xa71edc38d189767582c38a3145b5873052c3e47a',
        decimals: 18,
    }
    await fetchTokenInfo(hboTokenInfo)
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
            target: hboTokenInfo.address,
            instance: hboTokenInfo.instance,
            functionName: 'balanceOf',
            params: [poolObj.tokenAddress],
        })
    }

    // 4. get price
    callObjVec.push({
        target: usdTokenInfo.address,
        instance: await ethers.getContractAt('MdexPair', ZERO_ADDRESS),
        functionName: 'balanceOf',
        params: [lpUsdHbo],
    })
    callObjVec.push({
        target: hboTokenInfo.address,
        instance: await ethers.getContractAt('MdexPair', ZERO_ADDRESS),
        functionName: 'balanceOf',
        params: [lpUsdHbo],
    })

    const { returnData } = await multiCall(
        await generateCalls(callObjVec),
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
        (tokenBalanceOfLpAddress / 10 ** hboTokenInfo.decimals)
    const timestamp = hexToBigNumber(returnDataVec[returnDataVec.length - 1])
    const date = new Date(timestamp * 1000)
    const tvl = sumValue * price
    log(`HBO price: ${price} | TVL: ${tvl} | ${date.toLocaleString()}`)
}

const main = async () => {
    // await test1()
    // await test2()
    // await test3()
    // await test4()
    // await testGenerateCalls()
    await multiCallGetTvl()
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
