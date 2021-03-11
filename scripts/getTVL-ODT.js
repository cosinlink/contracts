const log = console.log.bind(console)
const contractFactoryPath = 'MdexRouter'
const contractAddress = '0xED7d5F38C79115ca12fe6C0041abb22F0A06C300'
// const lpMdxUsdt = '0x615e6285c5944540fd8bd921c9c8c56739fd1e13'
// const lpMdxUsdt = '0xc189c6c138e78e8a4c1f1633e4c402e0c49a6049' // lp-ODT-usdt
// const lpMdxUsdt = '0x2eb1efe826c462105adf724f8307416d605e40a7' // lp-ODT-husd
let ODTAddress = '0x991075Cc14A91Fe001528943B3EB6DF31CfF431F'
let USDTAddress = '0xa71edc38d189767582c38a3145b5873052c3e47a'
let ODTInstance, USDTInstance
let poolVec = require(__dirname + '/deploy/deployments/ocean-pools.json')

const getODTPrice = async () => {
    const lpODTUsdtAddress = poolVec[0].tokenAddress
    const balance0 = await ODTInstance.callStatic.balanceOf(lpODTUsdtAddress)
    const balance1 = await USDTInstance.callStatic.balanceOf(lpODTUsdtAddress)

    // should consider decimals !!!
    return balance1 / 1e18 / (balance0 / 1e18)
}

const getODTValueFromLp = async (lpTokenAddress, lpAmount, lpTotalSupply) => {
    // 通过 lp 数量计算其总价值对应的 ODT 数量应该是多少
    const balance0 = await ODTInstance.callStatic.balanceOf(lpTokenAddress)
    const amount0 = lpAmount.mul(balance0).div(lpTotalSupply)
    return amount0.mul(2)
}

const getTVL = async () => {
    let sumValue = ethers.BigNumber.from(0)
    let ODTValue
    const ODTPrice = await getODTPrice()

    for (const tokenInfo of poolVec) {
        const lpInstance = await ethers.getContractAt(
            'MdexPair',
            tokenInfo.tokenAddress
        )

        const poolInstance = await ethers.getContractAt(
            'Greeter',
            tokenInfo.poolAddress
        )
        // const lpTokenBalance = await lpInstance.callStatic.balanceOf(tokenInfo.poolAddress)
        const totalStakedAmount = await poolInstance.callStatic.totalSupply()
        log(
            `${tokenInfo.name} totalStaked in pool: ${(
                totalStakedAmount / 1e18
            ).toString()}`
        )

        if (tokenInfo.name === 'ODT') {
            ODTValue = totalStakedAmount
        } else {
            // 如果是 lp 抵押, 通过 lp 余额计算出其对应的 ODT 价值, 并且 *2
            // const ODTValue = await ODTInstance.callStatic.balanceOf(tokenInfo.tokenAddress)
            // log('getODTValueFromLp ODTValue', ODTValue.mul(2).toString())
            const lpTotalSupply = await lpInstance.callStatic.totalSupply()
            ODTValue = await getODTValueFromLp(
                tokenInfo.tokenAddress,
                totalStakedAmount,
                lpTotalSupply
            )
        }
        log(
            `${tokenInfo.name} TVL: ${(
                (ODTValue / 1e18) *
                ODTPrice
            ).toString()}\r\n`
        )
        sumValue = sumValue.add(ODTValue)
    }

    log('ODT SUM: ', (sumValue / 1e18).toString())
    log('ODT Price: ', ODTPrice.toString())
    log('All TVL: ', ((sumValue / 1e18) * ODTPrice).toString())
}

async function main() {
    ODTInstance = await ethers.getContractAt(
        'MdexPair',
        ODTAddress // ODT
    )
    USDTInstance = await ethers.getContractAt(
        'MdexPair',
        USDTAddress // USDT
    )
    await getTVL()
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
