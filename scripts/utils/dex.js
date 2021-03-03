
const getInstance = async (contractAddress) => {
    return await ethers.getContractAt(
        'MdexPair',
        contractAddress
    )
}

const fetchTokenInfo = async (tokenInfo) => {
    // 1. instance
    if (!tokenInfo.instance) {
        tokenInfo.instance = await getInstance(tokenInfo.address)
    }

    // 2. decimals
    if (!tokenInfo.decimals) {
        tokenInfo.decimals = await tokenInfo.instance.callStatic.decimals();
    }

    // 3. symbol
    if (!tokenInfo.symbol) {
        tokenInfo.symbol = await tokenInfo.instance.callStatic.symbol();
    }

    // 4. totalSupply
    // if (!tokenInfo.totalSupply) {
    //     tokenInfo.totalSupply = await tokenInfo.instance.callStatic.totalSupply();
    // }
}

const getTokenPrice = async (lpAddress, usdTokenInfo, tokenInfo) => {
    await fetchTokenInfo(usdTokenInfo)
    await fetchTokenInfo(tokenInfo)

    const balanceUsdToken = await usdTokenInfo.instance.callStatic.balanceOf(lpAddress)
    const balanceToken = await tokenInfo.instance.callStatic.balanceOf(lpAddress)

    // should consider decimals
    return (balanceUsdToken / 10**usdTokenInfo.decimals) / (balanceToken / 10**tokenInfo.decimals)
}

module.exports = {
    getInstance,
    fetchTokenInfo,
    getTokenPrice
}
