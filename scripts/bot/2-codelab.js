const moment = require('moment')

const main = async () => {
    let msg
    const date = new Date()
    const fmt = 'YYYY-MM-DD HH:MM:SS'

    msg = `${moment(date).add(8, 'hour').format(fmt)}`
    console.log(msg)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
