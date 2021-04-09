import {Wallet} from "@ethersproject/wallet";
import {getContract, sleep, waitTx} from "./helper";
import * as hre from 'hardhat'
import "@nomiclabs/hardhat-ethers";
import AddressRecordService from "./meta/addressRecordService";
import {initDb} from "./meta/initDb";
import {AddressRecord} from "./meta/addressRecord.entity";
import {prepareTokens} from "./prepareTokens";
import {prepareMdex} from "./prepareMdex";
import {TransactionResponse} from "@ethersproject/abstract-provider";
import {VoidSigner} from "ethers";
import {BigNumber} from "@ethersproject/bignumber";

const ethers = hre.ethers

export class Main {
    main = async () => {
        await hre.run("compile");
        console.log('network: ' + hre.network.name)

        let tx, dead = `0x000000000000000000000000000000000000dead`, save: Record<string, string> = {}
        let [operator] = await ethers.getSigners();
        console.log(`operator: ${operator.address}`)
        console.log(`operator balance: ${await operator.getBalance()}`)
        console.log(`operator gasPrics: ${await operator.getGasPrice()}`)

        let provider = ethers.provider
        console.log(`gasPrice: ${await provider.getGasPrice()}`)

        const unit = ethers.constants.WeiPerEther;
        let [usdt, , ht] = await prepareTokens(operator)
        let [mdexFactory, mdexRouter] = await prepareMdex(operator, ht.address)
        let voidSigner = new ethers.VoidSigner(dead)
        mdexRouter = mdexRouter.connect(voidSigner)

        let radioAddress = `0x1E0aBaF926013fAdC7da19aD41665bb753639A94`
        let udstAddress = `0xa71edc38d189767582c38a3145b5873052c3e47a`

        let radioToken = await getContract(operator, "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", radioAddress)

        let usdtToken = await getContract(operator, "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", udstAddress)


        await initDb('heco-bot', 'db/heco-bot.sqlite3')
        let service = new AddressRecordService('heco-bot')

        let records: Array<AddressRecord> = await service.getAllRecords()

        //specify arrange
        records = records.slice(30, 60)

        let wallets: Array<Wallet> = records.map((record) => {
            return new ethers.Wallet(record.privateKey, provider)
        })

        while (true) {
            const index = Math.floor(Math.random() * records.length)
            const record = records[index]
            const wallet = wallets[index]
            try {


                const amount = unit.mul(Math.round(Math.random() * 1000000))

                const remaining = ethers.utils.parseUnits(record.radioBalance, "ether")

                if (remaining.lt(amount)) {
                    continue
                }

                tx = await mdexRouter.connect(wallet).swapExactTokensForTokensSupportingFeeOnTransferTokens(
                    amount,
                    0,
                    [radioAddress, udstAddress],
                    records[index].address,
                    deadline()
                )

                tx = await waitTx(tx)

                const ethBalance = await provider.getBalance(record.address)
                await service.updateValue(wallet.address, "balance", ethers.utils.formatUnits(ethBalance, "ether"))

                const radioBalance = await (radioToken.balanceOf(wallet.address) as Promise<BigNumber>)
                await service.updateValue(wallet.address, "radioBalance", ethers.utils.formatUnits(radioBalance, "ether"))

                const usdtBalance = await (usdtToken.balanceOf(wallet.address) as Promise<BigNumber>)
                await service.updateValue(wallet.address, "usdtBalance", ethers.utils.formatUnits(usdtBalance, "ether"))

                await sleep(30*1000)
            }catch (e) {
                console.log(`${record.address}: ${e}`)
            }
        }


    }

}

new Main().main()


function deadline () {
    // 30 minutes
    return Math.floor(new Date().getTime() / 1000) + 1800;
}
