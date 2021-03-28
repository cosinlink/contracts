const log = console.log.bind(console)
const fs = require('fs')
const {fetchTokenInfo} = require('./utils/dex')
const {deployContract} = require('./utils/util')
const {fixedLengthLe} = require('./utils/string')
const {MaxUint256} = ethers.constants

// all deployed contracts
let contracts
let adminAddress
let calldataVec = []

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


// accountId: number
const accountIdToAddress = (accountId) => {
    const hexstr = ("0"+(Number(accountId).toString(16))).slice(-2).toUpperCase()
    return '0x' + fixedLengthLe(hexstr, 40)
}

const deployContracts = async () => {
    const MockUSDT = await deployContract('MockUSDT')
    calldataVec.push({
        index: 0,
        fromAccountId: 2,
        targetAccountId: 5,
        name: 'Deploy MockUSDT',
        calldata: MockUSDT.deployTransaction.data
    })

    const demoErrorPermission = await deployContract('DemoErrorPermission')
    calldataVec.push({
        index: 1,
        fromAccountId: 2,
        targetAccountId: 6,
        name: 'Deploy DemoErrorPermission',
        calldata: demoErrorPermission.deployTransaction.data
    })

    return {
        MockUSDT,
        demoErrorPermission
    }
}

const pairForTokens = async (tokenAAddress, tokenBAddress) => {
    return await contracts.factoryInstance.callStatic.pairFor(
        tokenAAddress,
        tokenBAddress
    )
}

const main = async () => {
    let tx
    const [signer] = await ethers.getSigners()
    adminAddress = signer.address
    log(`adminAddress:`, adminAddress)
    // 1. deploy MockUSDT and DemoErrorPermission
    contracts = await deployContracts()

    // 2. approve tokenA from user to demo
    const {MockUSDT, demoErrorPermission} = contracts
    const usdtObj = calldataVec[0]
    const demoObj = calldataVec[1]
    log('approve spender:', accountIdToAddress(demoObj.targetAccountId))
    calldataVec.push({
        index: calldataVec.length,
        fromAccountId: 2,
        targetAccountId: usdtObj.targetAccountId,
        name: 'user approve demo, MockUSDT, MaxUint256',
        calldata: await generateCallData(
            MockUSDT,
            'approve',
            [accountIdToAddress(demoObj.targetAccountId), MaxUint256]
        )
    })

    tx = await MockUSDT.approve(demoErrorPermission.address, MaxUint256)
    await tx.wait(1)

    // 3. call demo to testTransferFrom to creator address
    calldataVec.push({
        index: calldataVec.length,
        fromAccountId: 2,
        targetAccountId: demoObj.targetAccountId,
        name: 'user call demoErrorPermission.testTransferFrom, params: (user address, demoErrorPermission address, 999)',
        calldata: await generateCallData(
            demoErrorPermission,
            'testTransferFrom',
            [accountIdToAddress(usdtObj.targetAccountId), accountIdToAddress(demoObj.targetAccountId), 999]
        )
    })

    tx = await demoErrorPermission.testTransferFrom(MockUSDT.address, "0x1111111111111111111111111111111111111111", 999)
    await tx.wait(1)
    log(` demoErrorPermission.testTransferFrom success`)

    tx = await MockUSDT.approve(adminAddress, MaxUint256)
    await tx.wait(1)

    // approve user->user  MaxUint256
    calldataVec.push({
        index: calldataVec.length,
        fromAccountId: 2,
        targetAccountId: usdtObj.targetAccountId,
        name: 'approve user1->user1  MaxUint256',
        calldata: await generateCallData(
            MockUSDT,
            'approve',
            [accountIdToAddress(2), MaxUint256]
        )
    })


    // direct transferFrom, user1 -> demo  998
    calldataVec.push({
        index: calldataVec.length,
        fromAccountId: 2,
        targetAccountId: usdtObj.targetAccountId,
        name: ' direct transferFrom, user1 -> demo  998',
        calldata: await generateCallData(
            MockUSDT,
            'transferFrom',
            [accountIdToAddress(2), accountIdToAddress(demoObj.targetAccountId), 998]
        )
    })


    tx = await MockUSDT.transferFrom(adminAddress, demoErrorPermission.address, 998)
    await tx.wait(1)


    // balanceOf
    calldataVec.push({
        index: calldataVec.length,
        fromAccountId: 2,
        targetAccountId: usdtObj.targetAccountId,
        name: 'balanceOf',
        calldata: await generateCallData(
            MockUSDT,
            'balanceOf',
            [accountIdToAddress(4)]  // creator
        )
    })
    log((await MockUSDT.balanceOf(demoErrorPermission.address)).toString())


    calldataVec.push({
        index: calldataVec.length,
        fromAccountId: 2,
        targetAccountId: usdtObj.targetAccountId,
        name: 'balanceOf',
        calldata: await generateCallData(
            MockUSDT,
            'balanceOf',
            [accountIdToAddress(2)]  // user
        )
    })


    fs.writeFileSync(
        '/Users/hyz/RustProjects/godwoken-uniswap-example' + '/' + 'error-permission.calldata.json',
        JSON.stringify(calldataVec, null, 2)
    )
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
