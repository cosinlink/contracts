const { getContract } = require('./helper')
const { waitTx } = require('./helper')

async function main() {
    let tx
    console.log('network: ' + network.name)

    let [
        _operator,
        _team,
        _investor,
        _marketing,
        _validator,
        miner,
    ] = await ethers.getSigners()

    console.log('miner: ' + (await miner.getAddress())) // init lp comes from here

    if (
        (await miner.getAddress()).toLowerCase() !==
        '0xd9276f913bADF3258eC5B7a161e901cFa9c3307A'.toLowerCase()
    ) {
        console.log('miner error')
        return
    }

    const unit = ethers.constants.WeiPerEther
    console.log('unit: ' + unit.toString())

    let ocean_miner = await getContract(
        miner,
        'Ocean',
        '0x991075Cc14A91Fe001528943B3EB6DF31CfF431F'
    )

    let usdt1ocean2oceanPool = await getContract(
        miner,
        'OceanPool',
        '0xcc3de43fe2376D550Acb139C17a9f2344BA77AaC'
    )

    let ht1ocean2oceanPool = await getContract(
        miner,
        'OceanPool',
        '0x8aecB96B6A93d4e338158055c7E66dd261B3950F'
    )

    let btc1ocean2oceanPool = await getContract(
        miner,
        'OceanPool',
        '0xD5D1D9Bd3CF0e0c61955B0291b346240Fd53e4e3'
    )

    let ocean2oceanPool = await getContract(
        miner,
        'OceanPool',
        '0x7B27D8e0C819aa10CbDF53CB0f5Fe53C3df7bA63'
    )

    let usdt2oceanPool = await getContract(
        miner,
        'OceanPool',
        '0xb879653dF4208F8b03DbD5A7665A286231886Ae8'
    )

    // notify reward
    /*
  const REWARD_PER_DAY = {
    HTLP: 42808,
    USDTLP: 42808,
    BTCLP: 42808,
    OCEAN: 42808,
    USDT: 428,
  }
   */

    const usdt1ocean2oceanAmount = unit.mul(42808)
    tx = await ocean_miner.transfer(
        usdt1ocean2oceanPool.address,
        usdt1ocean2oceanAmount.toString()
    )
    await waitTx(tx)
    console.log(
        `Deposited ${usdt1ocean2oceanAmount} ocean to Pool ${usdt1ocean2oceanPool.address}`
    )
    tx = await usdt1ocean2oceanPool.notifyRewardAmount(
        usdt1ocean2oceanAmount.toString()
    )
    await waitTx(tx)
    console.log(`usdt1ocean2oceanPool notifyRewardAmount`)

    const ht1ocean2oceanAmount = unit.mul(42808)
    tx = await ocean_miner.transfer(
        ht1ocean2oceanPool.address,
        ht1ocean2oceanAmount.toString()
    )
    await waitTx(tx)
    console.log(
        `Deposited ${ht1ocean2oceanAmount} ocean to Pool ${ht1ocean2oceanPool.address}`
    )
    tx = await ht1ocean2oceanPool.notifyRewardAmount(
        ht1ocean2oceanAmount.toString()
    )
    await waitTx(tx)
    console.log(`ht1ocean2oceanPool notifyRewardAmount`)

    const btc1ocean2oceanAmount = unit.mul(42808)
    tx = await ocean_miner.transfer(
        btc1ocean2oceanPool.address,
        btc1ocean2oceanAmount.toString()
    )
    await waitTx(tx)
    console.log(
        `Deposited ${btc1ocean2oceanAmount} ocean to Pool ${btc1ocean2oceanPool.address}`
    )
    tx = await btc1ocean2oceanPool.notifyRewardAmount(
        btc1ocean2oceanAmount.toString()
    )
    await waitTx(tx)
    console.log(`mdx1ocean2oceanPool notifyRewardAmount`)

    const ocean2oceanAmount = unit.mul(42808)
    tx = await ocean_miner.transfer(
        ocean2oceanPool.address,
        ocean2oceanAmount.toString()
    )
    await waitTx(tx)
    console.log(
        `Deposited ${ocean2oceanAmount} ocean to Pool ${ocean2oceanPool.address}`
    )
    tx = await ocean2oceanPool.notifyRewardAmount(ocean2oceanAmount.toString())
    await waitTx(tx)
    console.log(`ocean2oceanPool notifyRewardAmount`)

    const usdt2oceanAmount = unit.mul(428)
    tx = await ocean_miner.transfer(
        usdt2oceanPool.address,
        usdt2oceanAmount.toString()
    )
    await waitTx(tx)
    console.log(
        `Deposited ${usdt2oceanAmount} ocean to Pool ${usdt2oceanPool.address}`
    )
    tx = await usdt2oceanPool.notifyRewardAmount(usdt2oceanAmount.toString())
    await waitTx(tx)
    console.log(`usdt2oceanPool notifyRewardAmount`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
