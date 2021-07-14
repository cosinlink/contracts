const { fetchTokenInfo } = require('../utils/dex.js')
const { generateCalls, multiCall, BSCMulticallAddress } = require('../utils/multicall')
const { hexToBigNumber } = require('../utils/string')
const { sleep, dateFormat } = require('../utils/util')
const sendToAddrTg = require('../tg/addr-notification')
const fs = require('fs')
const readline = require('readline');
const moment = require('moment')

const log = console.log.bind(console)
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

// 6 hours
const Interval_Seconds = 6 * 60 * 60

// pancake
const targetTokenInfo = {
    address: '0xdf0816cc717216c8b0863af8d4f0fc20bc65d643',
    decimals: 18,
}

// busd
const usdTokenInfo = {
    address: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
    decimals: 18,
}

// WBNB
const wethTokenInfo = {
    address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
    decimals: 18,
}

const lpTargetWETHAddress = '0x0b85ddf1921ab0efbfabd0b178b90f64ea2b11d3'
const lpWETHBUSDAddress = '0x1b96b92314c44b159149f7e0303511fb2fc4774f'

const strategyList = [
    '0x298554c3ea5bb9ce6457de3e7b6a89127f6486b7', // HMDX-USDT
    '0x79b91732b045611e10922fa9855e4697fdcce9f4', // MDX-HMDX
    '0x7ed3dc0a9a06842011b1d82783a51ae471b486e5', // MDX-BTC
    '0x5219b2ffff1b6c47800ae1f101cbc2bbc2e72f9e', // MDX-ETH
    '0xc62ee4e3db7bc2d21361e771b2debfc1b08187f1', // MDX-BUSD
    '0xe6c3f6c2aefdcc6dae75bc7fff2a2f9d0930b49e', // MDX-USDT
    '0x51c1a9b55da9ac3eb043a1ab02cf60c9963d6d62',  // BNB-MDX
    '0x9c199b818c7f678e1cac2069d1c01acf0f28185e',   // BUSD-USDT
    '0x81ec3372ec82d4e34bc0ce053dd21e441f27419c',   // BNB-USDT
    '0x055e352aed71b69a277e1a23cfb44aa8d0ca8e89',  // ETH-USDT
    '0x985a1bf259b1ea8331ab043525a24128f005e9b6',  // BTC-USDT
    '0x64f8afe3ac479aa44339354303ecffa4146b377c',  // BNB-BUSD
    '0x4dcc71c0458289df668605c579218612c844a506',   // ETH-BTC
    '0x680f3eb5afa8385172892c17598b7dad355afe68',  // DOT-USDT
    '0x8A304D8B5F28aBE205c8e0417010103A9D2206e5', // ETH-BNB
    '0xe78aF22D6EF9494e428b9F8109db53C847ca65E7' // LTC-USDT
]

const instances = []

const init = async () => {
    for (let i = 0; i < strategyList.length; i++) {
        const instance = await ethers.getContractAt('MdexBSCPoolLPStrategy', strategyList[i])
        instances.push(instance)
    }
}

const circulate = async () => {
    const [signer] = await ethers.getSigners();
    const balanceBefore = await signer.getBalance()

    let tx
    for (let i = 0; i < instances.length; i++) {
        const strategy = instances[i]

        try {
            tx = await strategy.circulate()
            await tx.wait(20)
        } catch (e) {
            log("Failed!", i, strategy.address)
        }
    }
    const balance = await signer.getBalance()
    log('current: ', balance / 1e18, 'used: ', (balanceBefore - balance) / 1e18)
}

const main = async () => {
    await init()
    while (true) {
        try {
            await circulate()
            await sleep(Interval_Seconds)
        } catch (e) {
            const msg = `----error: ${e}, restart after 30s`
            // await sendToAddrTg(msg, "SECRET")
            log(msg)
            await sleep(30)
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
