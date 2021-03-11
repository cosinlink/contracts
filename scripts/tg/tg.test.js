const sendTgMsg = require('./notification')

const main = async () => {
    await sendTgMsg('*test*', 'ODT_LOTTERY_MONITOR')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
