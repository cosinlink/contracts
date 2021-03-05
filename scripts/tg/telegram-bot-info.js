const {TelegramClient} =  require('messaging-api-telegram')
require('dotenv').config()
const config = process.env

function getTgInfo() {
    console.log('config.TELEGRAM_BOT_KEY', config.TELEGRAM_BOT_KEY)
    const tgConfig = {
        accessToken: config.TELEGRAM_BOT_KEY,
    }
    const client = new TelegramClient(tgConfig)
    client.getUpdates({limit: 10}).then((text) => {
        text.map((obj) => {
            console.log(obj)
        })
    })
}


getTgInfo()
