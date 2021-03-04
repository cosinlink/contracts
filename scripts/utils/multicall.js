let multicallInstance
let multicallAddress = '0x5F6C56Ae1546A7371d529D5620D5Ff6c07394AfE'

/*
* @param callObjVev
* const callObjVec = [
*   {
*       target: '0x7565a0a69156549c8e1eb2c219458018c3aaf196',
*       instance: await ethers.getContractAt('MdexPair', '0xa71edc38d189767582c38a3145b5873052c3e47a'),
*       functionName: 'balanceOf',
*       params: ['0x0000000000000000000000000000000000000000']
*   }
* ]
* */
const generateCalls = async (callObjVec) => {
    const calls = []
    for (const { target, instance, functionName, params } of callObjVec) {
        const tx = await instance.populateTransaction[functionName](...params)
        calls.push({
            target,
            callData: tx.data
        })
    }
    return calls
}

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
    generateCalls,
    multiCall
}
