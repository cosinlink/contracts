const { getTokenPrice } = require('./dex.js')
const { calcPoolTotalTokenValue } = require('./pool.js')
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
    const poolInfo = {
        address: '0x7565a0a69156549c8e1eb2c219458018c3aaf196'
    }

    const lpInfo = {
        address: '0xc189c6c138e78e8a4c1f1633e4c402e0c49a6049'
    }

    const usdtTokenInfo = {
        address: '0xa71edc38d189767582c38a3145b5873052c3e47a',
        decimals: 18
    }

    const hboTokenInfo = {
        address: '0x8764bd4fcc027faf72ba83c0b2028a3bae0d2d57',
        decimals: 18
    }

    const poolTotalTokenValueByHBO = await calcPoolTotalTokenValue(
        poolInfo,
        lpInfo,
        hboTokenInfo,
        usdtTokenInfo,
        true
    )

    log(`poolTotalTokenValueByHBO: ${ poolTotalTokenValueByHBO / 1e18 }`)
    log(Object.keys(poolInfo))


    const { price } = await getTokenPrice(
        lpInfo.address,
        usdtTokenInfo,
        hboTokenInfo
    )
    log(`TVL: ${ poolTotalTokenValueByHBO / 1e18 * price }`)
}

const main = async () => {
    // await test1()
    // await test2()
    await test3()
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
