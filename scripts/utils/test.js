const { getTokenPrice } = require('./dex.js')
const log = console.log.bind(console)

const test = async () => {
    const usdTokenInfo = {
        address: '0xa71edc38d189767582c38a3145b5873052c3e47a',
        decimals: 18
    }

    const hboTokenInfo = {
        address: '0x8764bd4fcc027faf72ba83c0b2028a3bae0d2d57',
        decimals: 18
    }

    const tokenPrice = await getTokenPrice(
        '0xc189c6c138e78e8a4c1f1633e4c402e0c49a6049',
        usdTokenInfo,
        hboTokenInfo
    )

    log(hboTokenInfo.symbol, usdTokenInfo.symbol, tokenPrice)
}

test()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
