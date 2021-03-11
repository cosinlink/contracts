const deployContract = async (signer, factoryPath, ...args) => {
    const factory = await ethers.getContractFactory(factoryPath)
    const contract = await factory.connect(signer).deploy(...args)
    await contract.deployTransaction.wait(1)
    return contract
}

const getContract = async (signer, abiname, address) => {
    return await ethers.getContractAt(abiname, address, signer)
}

const waitTx = async (tx) => {
    await tx.wait(1)
}

module.exports = {
    deployContract,
    getContract,
    waitTx,
}
