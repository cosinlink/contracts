require("@nomiclabs/hardhat-waffle");
require('dotenv').config()

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat: {},
    'heco': {
      url: `${process.env.HECO_API}`,
      accounts: {
        mnemonic: `${process.env.HECO_DEPLOYER_MNEMONIC}`
      },
    },
    'heco-lottery': {
      url: `${process.env.HECO_API}`,
      accounts: {
        mnemonic: `${process.env.HECO_LOTTERY_DEPLOYER_MNEMONIC}`
      },
    },
    'heco-test': {
      url: `${process.env.HECO_TEST_API}`,
      accounts: {
        mnemonic: `${process.env.HECO_TEST_DEPLOYER_MNEMONIC}`
      },
    },
    'heco-wool': {
      url: `${process.env.HECO_API}`,
      accounts: {
        mnemonic: `${process.env.HECO_USDT_DEPLOYER_MNEMONIC}`
      },
    },
    'bsc': {
      url: `${process.env.BSC_API}`,
      accounts: {
        mnemonic: `${process.env.HECO_USDT_DEPLOYER_MNEMONIC}`
      },
    },
    'bsc-main-test': {
      url: `${process.env.BSC_API}`,
      accounts: {
        mnemonic: `${process.env.BSC_TEST_MNEMONIC}`
      },
    }
  },
  solidity: {
    compilers: [
      {
        version: "0.5.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: "0.6.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: "0.7.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: "0.8.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    ]
  },
};

