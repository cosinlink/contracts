const log = console.log.bind(console)
const fs = require('fs')
const { fetchTokenInfo } = require('./utils/dex')
const { deployContract } = require('./utils/util')
const { MaxUint256 } = ethers.constants

// all deployed contracts
let contracts
let adminAddress

/*
 * @dev example
 *       instance: await ethers.getContractAt('MdexPair', '0xa71edc38d189767582c38a3145b5873052c3e47a'),
 *       functionName: 'balanceOf',
 *       params: ['0x0000000000000000000000000000000000000000']
 * */
const generateCallData = async (instance, functionName, params) => {
    const tx = await instance.populateTransaction[functionName](...params)
    return tx.data
}

const deployUniswapContracts = async () => {
    const wethInstance = await deployContract('WETH')
    // log('wethInstance.deployTransaction.data: ', wethInstance.deployTransaction.data)

    const factoryInstance = await deployContract(
        'MdexFactory',
        '0x0000000000000000000000000000000000000000'
    )
    // log('factoryInstance.deployTransaction.data: ', factoryInstance.deployTransaction.data)

    const routerInstance = await deployContract(
        'MdexRouter',
        factoryInstance.address,
        wethInstance.address
    )
    // log('routerInstance.deployTransaction.data: ', routerInstance.deployTransaction.data)

    const MockUsdt = await deployContract('MockUSDT')
    const MockBTC = await deployContract('MockBTC')

    const pairAddress = factoryInstance.callStatic.pairFor(
        MockBTC.address,
        MockUsdt.address
    )

    const deployObj = {
        WETH: wethInstance.address,
        Factory: factoryInstance.address,
        Router: routerInstance.address,
        BTC: MockBTC.address,
        USDT: MockUsdt.address,
        'LP-USDT-BTC': pairAddress,
    }
    fs.writeFileSync(
        __dirname + '/' + 'deployments' + '/' + '1.json',
        JSON.stringify(deployObj, null, 2)
    )

    return {
        wethInstance,
        factoryInstance,
        routerInstance,
        MockUsdt,
        MockBTC,
    }
}

const pairForTokens = async (tokenAAddress, tokenBAddress) => {
    return await contracts.factoryInstance.callStatic.pairFor(
        tokenAAddress,
        tokenBAddress
    )
}

const addLiquidity = async () => {
    const router = contracts.routerInstance
    const unit = ethers.constants.WeiPerEther
    const usdtAmount = unit.mul(1000)
    const btcAmount = unit.mul(2)
    const deadline = ethers.constants.MaxUint256

/*
    const calldata = await generateCallData(router, 'addLiquidity', [
        contracts.MockBTC.address,
        contracts.MockUsdt.address,
        btcAmount,
        usdtAmount,
        btcAmount,
        usdtAmount,
        adminAddress,
        deadline,
    ])
*/

    const tx = await router.addLiquidity(
        contracts.MockBTC.address,
        contracts.MockUsdt.address,
        btcAmount,
        usdtAmount,
        btcAmount,
        usdtAmount,
        adminAddress,
        deadline
    )
    await tx.wait(1)

    return tx
}

const removeLiquidity = async () => {
    const router = contracts.routerInstance
    const deadline = ethers.constants.MaxUint256

    const pairAddress = await pairForTokens(
        contracts.MockBTC.address,
        contracts.MockUsdt.address
    )
    const tokenInfo = await fetchTokenInfo({
        address: pairAddress,
    })
    const lpAmount = await tokenInfo.instance.callStatic.balanceOf(adminAddress)

    const tx = await router.removeLiquidity(
        contracts.MockBTC.address,
        contracts.MockUsdt.address,
        lpAmount,
        0,
        0,
        adminAddress,
        deadline
    )
    await tx.wait(1)
    return tx
}

const swapToken = async () => {
    const router = contracts.routerInstance
    const unit = ethers.constants.WeiPerEther
    const usdtAmount = unit.mul(500)
    const btcAmountExpectMin = unit.mul(0)

    const deadline = ethers.constants.MaxUint256

    const tx = await router.swapExactTokensForTokens(
        usdtAmount,
        btcAmountExpectMin,
        [contracts.MockUsdt.address, contracts.MockBTC.address],
        adminAddress,
        deadline
    )
    await tx.wait(1)
    return tx
}

const main = async () => {
    let tx
    const [signer] = await ethers.getSigners()
    adminAddress = signer.address
    log(`adminAddress:`, adminAddress)
    // 1. deploy uniswap factory and router, deploy 3 mock erc20 token contract
    contracts = await deployUniswapContracts()

    // 2. approve tokenA and tokenB amounts from user to router
    const { MockBTC, MockUsdt, routerInstance } = contracts
    tx = await MockBTC.approve(routerInstance.address, MaxUint256)
    await tx.wait(1)
    tx = await MockUsdt.approve(routerInstance.address, MaxUint256)
    await tx.wait(1)

    // 3. addLiquidity
    tx = await addLiquidity()

    // 4. swap
    tx = await swapToken()

    // 5. approve lp amount from user to router
    const pairAddress = await pairForTokens(
        contracts.MockBTC.address,
        contracts.MockUsdt.address
    )
    const tokenInfo = await fetchTokenInfo({
        address: pairAddress,
    })
    const lpAmount = await tokenInfo.instance.callStatic.balanceOf(adminAddress)
    tx = await tokenInfo.instance.approve(routerInstance.address, lpAmount)
    await tx.wait(1)

    // 6. removeLiquidity
    tx = await removeLiquidity()
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
