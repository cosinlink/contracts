const hre = require('hardhat')
const log = console.log.bind(console)
const contractFactoryPath = 'MdexRouter'
const contractAddress = '0xED7d5F38C79115ca12fe6C0041abb22F0A06C300'
// const lpMdxUsdt = '0x615e6285c5944540fd8bd921c9c8c56739fd1e13'
const lpMdxUsdt = '0x909068819c45c117a2eEb4bbe329b803D62D1f45' // lp-ODT-HBTC

async function main() {
    const instance = await ethers.getContractAt(
        contractFactoryPath,
        contractAddress
    )

    const lpInstance = await ethers.getContractAt('MdexPair', lpMdxUsdt)

    const tokenA = '0x991075Cc14A91Fe001528943B3EB6DF31CfF431F' // ODT
    const tokenAInstance = await ethers.getContractAt(
        'MdexPair',
        tokenA // ODT
    )

    const tokenB = '0x66a79d23e58475d2738179ca52cd0b41d73f0bea' // HBTC
    const tokenBInstance = await ethers.getContractAt(
        'MdexPair',
        tokenB // HBO
    )
    // const liquidity = await lpInstance.callStatic.balanceOf(userAddr)
    const liquidity = 44 * 1e18

    const balance0 = await tokenAInstance.callStatic.balanceOf(lpMdxUsdt)
    const balance1 = await tokenBInstance.callStatic.balanceOf(lpMdxUsdt)
    const totalSupply = await lpInstance.callStatic.totalSupply()

    const amount0 = (liquidity * balance0) / totalSupply
    const amount1 = (liquidity * balance1) / totalSupply

    log(
        `Lp-ODT-HBTC info, amount0, amount1: `,
        (amount0 / 1e18).toString(),
        (amount1 / 1e18).toString()
    )
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
