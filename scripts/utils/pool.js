const { getTokenPrice, fetchTokenInfo, fetchPoolInfo } = require('./dex.js')


// example
// 1. TotalTokenValue of HBO pool = All HBO Amount staked in pool
// 2. TotalTokenValue of HBO-USDT-LP pool = (All HBO Amount from HBO-USDT-LP Amount staked in pool) * 2
const calcPoolTotalTokenValue = async (poolInfo, stakeTokenInfo, basicTokenInfo, tokenInfo, isLpToken = true) => {
    await fetchPoolInfo(poolInfo)
    await fetchTokenInfo(stakeTokenInfo)
    await fetchTokenInfo(basicTokenInfo)
    await fetchTokenInfo(tokenInfo)
    const stakedTokenInstance = stakeTokenInfo.instance
    const poolInstance = poolInfo.instance

    const totalStakedAmount = await poolInstance.callStatic.totalSupply()

    // 1. HBO pool
    if (!isLpToken) {
        return totalStakedAmount
    }

    // 2. HBO-xxx-LP pool
    const lpTotalSupply = await stakedTokenInstance.callStatic.totalSupply()
    const { lpTotalValue } = await getTokenPrice(
        stakeTokenInfo.address,
        basicTokenInfo,
        tokenInfo
    )
    return totalStakedAmount / lpTotalSupply * lpTotalValue
}

module.exports = {
    calcPoolTotalTokenValue
}
