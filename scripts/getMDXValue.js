const log = console.log.bind(console)
const {getTokenValueFromLpAmount} = require('./utils/dex')
const contractFactoryPath = 'contracts/mainnet/MdxToken.sol:MdxToken' // just use its api
const tokenAddress = '0x25d2e80cb6b86881fd7e07dd263fb79f4abe033c' // mdx
const usdtAddress = '0xa71edc38d189767582c38a3145b5873052c3e47a' // usdt
const lpAddress = '0x615e6285c5944540fd8bd921c9c8c56739fd1e13' // lp-mdx-usdt
const poolAddress = '0xfb03e11d93632d97a8981158a632dd5986f5e909' // lp-mdx-usdt heco pool
const lpPoolPid = 16
const userAddress = '0xe389F749128aeEb1A038b9b479520cdDa5312079'

async function main() {
    const poolInstance = await ethers.getContractAt(
        'HecoPool',
        poolAddress
    )

    const {amount} = await poolInstance.callStatic.userInfo(lpPoolPid, userAddress)

    const value = await getTokenValueFromLpAmount(
        {
            address: lpAddress,
            decimals: 18
        },
        {
            address: usdtAddress,
            decimals: 18
        },
        amount
    )
    log(`lpAmount: ${amount / 1e18}, usd value: ${value / 1e18}`)

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
