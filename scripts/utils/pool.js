const {
    getTokenPrice,
    fetchTokenInfo,
    fetchPoolInfo,
    getTokenValueFromLp,
} = require('./dex.js')
const log = console.log.bind(console)

// example
// 1. TotalTokenValue of HBO pool = All HBO Amount staked in pool
// 2. TotalTokenValue of HBO-USDT-LP pool = (All HBO Amount from HBO-USDT-LP Amount staked in pool) * 2
const calcPoolTotalTokenValue = async (
    poolInfo,
    stakeTokenInfo,
    basicTokenInfo,
    isLpToken = true
) => {
    await fetchPoolInfo(poolInfo)
    await fetchTokenInfo(stakeTokenInfo)
    await fetchTokenInfo(basicTokenInfo)
    const stakedTokenInstance = stakeTokenInfo.instance
    const poolInstance = poolInfo.instance

    const totalStakedAmount = await poolInstance.callStatic.totalSupply()

    // 1. HBO pool
    if (!isLpToken) {
        return totalStakedAmount
    }

    // 2. HBO-xxx-LP pool
    const lpTotalSupply = await stakedTokenInstance.callStatic.totalSupply()
    const lpTotalValue = await getTokenValueFromLp(
        stakeTokenInfo.address,
        basicTokenInfo
    )

    return (totalStakedAmount / lpTotalSupply) * lpTotalValue
}

const calcPoolsTVL = async (
    poolVec,
    lpAddress,
    basicTokenInfo,
    usdtTokenInfo
) => {
    const { price } = await getTokenPrice(
        lpAddress,
        usdtTokenInfo,
        basicTokenInfo
    )

    let sumValue = 0
    for (const poolObj of poolVec) {
        const isLp = poolObj.name.endsWith('LP')
        log(poolObj.name)
        const tokenValue = await calcPoolTotalTokenValue(
            {
                address: poolObj.poolAddress,
            },
            {
                address: poolObj.tokenAddress,
            },
            basicTokenInfo,
            isLp
        )
        sumValue = sumValue + tokenValue / 10 ** basicTokenInfo.decimals
    }

    return sumValue * price
}

module.exports = {
    calcPoolTotalTokenValue,
    calcPoolsTVL,
}
