
const getTokenInstance = async (contractAddress) => {
    return await ethers.getContractAt(
        'MdexPair',
        contractAddress
    )
}

const fetchTokenInfo = async (tokenInfo) => {
    // 1. instance
    if (!tokenInfo.instance) {
        tokenInfo.instance = await getTokenInstance(tokenInfo.address)
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

/*
    @param tokenInfo
    const usdTokenInfo = {
        address: '0xa71edc38d189767582c38a3145b5873052c3e47a',
        decimals: 18
    }
* */
const getTokenPrice = async (lpAddress, usdTokenInfo, tokenInfo) => {
    await fetchTokenInfo(usdTokenInfo)
    await fetchTokenInfo(tokenInfo)

    const balanceUsdToken = await usdTokenInfo.instance.callStatic.balanceOf(lpAddress)
    const balanceToken = await tokenInfo.instance.callStatic.balanceOf(lpAddress)

    // should consider decimals
    const price = (balanceUsdToken / 10**usdTokenInfo.decimals) / (balanceToken / 10**tokenInfo.decimals)

    return {
        price,
        balanceUsdToken,
        balanceToken,
        lpTotalValue: balanceUsdToken.mul(2)
    }
}



module.exports = {
    getTokenInstance,
    fetchTokenInfo,
    getTokenPrice
}
