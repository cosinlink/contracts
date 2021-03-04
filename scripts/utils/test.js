const { getTokenPrice, fetchPoolInfo } = require('./dex.js')
const { calcPoolTotalTokenValue, calcPoolsTVL } = require('./pool.js')
const log = console.log.bind(console)

const test1 = async () => {
    const usdTokenInfo = {
        address: '0xa71edc38d189767582c38a3145b5873052c3e47a',
        decimals: 18
    }

    const hboTokenInfo = {
        address: '0x8764bd4fcc027faf72ba83c0b2028a3bae0d2d57',
        decimals: 18
    }

    const tokenPriceInfo = await getTokenPrice(
        '0xc189c6c138e78e8a4c1f1633e4c402e0c49a6049',
        usdTokenInfo,
        hboTokenInfo
    )

    log(`${hboTokenInfo.symbol}/${usdTokenInfo.symbol} Price: ${tokenPriceInfo.price.toFixed(4)}`)
    log(`${ 
        tokenPriceInfo.balanceUsdToken / 10**usdTokenInfo.decimals 
    }, ${ 
        tokenPriceInfo.balanceToken / 10**hboTokenInfo.decimals
    }, ${ 
        tokenPriceInfo.lpTotalValue / 1e18
    }`)
}

const test2 = async () => {
    const signers = await ethers.getSigners()
    const users = signers.map((signerWithAddress) => signerWithAddress.address)
    log(users)
}

const test3 = async () => {
    let poolVec = [
        {
            name: "HBO-USDT-LP",
            tokenAddress: "0xc189c6c138e78e8a4c1f1633e4c402e0c49a6049",
            poolAddress: "0x7565a0a69156549c8e1eb2c219458018c3aaf196",
            value: ""
        },
        {
            name: "HBO-HBTC-LP",
            tokenAddress: "0xa6e787c0efc68c9a400db05e7764ff2d224c4f6a",
            poolAddress: "0xe43dE0a82e4229eC05b629E4656561903029ADef",
            value: ""
        },
        {
            name: "HBO-HT-LP",
            tokenAddress: "0x235d09d666fb95ea422ef8d3523936a6140b20bb",
            poolAddress: "0xc3c59D153612166aC5ae10EBd643467363dDc1F0",
            value: ""
        },
        {
            name: "HBO-HUSD-LP",
            tokenAddress: "0x2eb1efe826c462105adf724f8307416d605e40a7",
            poolAddress: "0xb8dD7B1b69B17492e1d26a46aF00366088F36e32",
            value: ""
        },
        {
            name: "HBO",
            tokenAddress: "0x8764bd4fcc027faf72ba83c0b2028a3bae0d2d57",
            poolAddress: "0x0f1228dfb46a92825858ec417db7fb3b542c1df8",
            value: ""
        },
    ]

    const lpUsdtHbo = "0xc189c6c138e78e8a4c1f1633e4c402e0c49a6049"

    const tvl = await calcPoolsTVL(
        poolVec,
        lpUsdtHbo,
        {
            address: "0x8764bd4fcc027faf72ba83c0b2028a3bae0d2d57",
            decimals: 18
        },
        {
            address: "0xa71edc38d189767582c38a3145b5873052c3e47a",
            decimals: 18
        }
    )
    log('tvl: ', tvl)
}

const test4 = async () => {
    let poolVec = [
        {
            name: "HBO-USDT-LP",
            tokenAddress: "0xc189c6c138e78e8a4c1f1633e4c402e0c49a6049",
            poolAddress: "0x7565a0a69156549c8e1eb2c219458018c3aaf196",
            value: ""
        },
        {
            name: "HBO-HBTC-LP",
            tokenAddress: "0xa6e787c0efc68c9a400db05e7764ff2d224c4f6a",
            poolAddress: "0xe43dE0a82e4229eC05b629E4656561903029ADef",
            value: ""
        },
        {
            name: "HBO-HT-LP",
            tokenAddress: "0x235d09d666fb95ea422ef8d3523936a6140b20bb",
            poolAddress: "0xc3c59D153612166aC5ae10EBd643467363dDc1F0",
            value: ""
        },
        {
            name: "HBO-HUSD-LP",
            tokenAddress: "0x2eb1efe826c462105adf724f8307416d605e40a7",
            poolAddress: "0xb8dD7B1b69B17492e1d26a46aF00366088F36e32",
            value: ""
        },
        {
            name: "HBO",
            tokenAddress: "0x8764bd4fcc027faf72ba83c0b2028a3bae0d2d57",
            poolAddress: "0x0f1228dfb46a92825858ec417db7fb3b542c1df8",
            value: ""
        },
    ]

    for (const poolObj of poolVec) {
        const poolInfo = await fetchPoolInfo({
            address: poolObj.poolAddress
        })
        const rewardRate = await poolInfo.instance.callStatic.rewardRate()
        log(poolObj.name ,'rewardRate: ', rewardRate.toString())
        log('rewardRate * 1 days: ', rewardRate / 1e18 * 24 * 3600)
    }

}

const testMultiCall = async () => {
    const poolInstance = await ethers.getContractAt(
        'NFIUSDTPool',
        "0x0000000000000000000000000000000000000000"
    )

    /*
    *   @dev other way to generate calldata
    *    let ABI = [
    *        "function totalSupply()"
    *    ]
    *    let iface = new ethers.utils.Interface(ABI);
    *    log(`calldata: `, iface.encodeFunctionData("totalSupply"))=
    * */
    const tx = await poolInstance.populateTransaction.balanceOf('0x92531122B728cbEd7FDA325Ac8690A9681684C04');
    const callObj = {
        target: '0x7565a0a69156549c8e1eb2c219458018c3aaf196',  // contract address to call
        callData: tx.data  //
    }

    let res = await multiCall([callObj])
    log(ethers.BigNumber.from(res.returnData[0]) / 1e18.toString())
}

const main = async () => {
    // await test1()
    // await test2()
    // await test3()
    // await test4()
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
