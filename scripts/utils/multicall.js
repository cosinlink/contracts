let multicallInstance
let multicallAddress = '0x5F6C56Ae1546A7371d529D5620D5Ff6c07394AfE'

/*
* @dev
* const tx = await poolInstance.populateTransaction.totalSupply();
* const calls = [
*   {
*       target: '0x7565a0a69156549c8e1eb2c219458018c3aaf196',  // contract address to call
        callData: tx.data
*   }
* ]
* */
const multiCall = async (calls) => {
    if (!multicallInstance) {
        multicallInstance = await ethers.getContractAt('Multicall', multicallAddress)
    }
    return await multicallInstance.callStatic.aggregate(calls)
}

module.exports = {
    multiCall
}
