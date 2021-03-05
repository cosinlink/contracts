const {TelegramClient} = require( 'messaging-api-telegram')
require('dotenv').config()

module.exports = async (text) => {
    const config = process.env
    if (!config.TELEGRAM_BOT_KEY) {
        throw new Error('cannot find TELEGRAM_BOT_KEY config')
    }

    const chat_id = config.DEV ? config.TELEGRAM_CHANNEL_ID : config.TELEGRAM_INTERNAL_GROUP
    const client = new TelegramClient({
        accessToken: config.TELEGRAM_BOT_KEY,
    })
    await client.sendMessage(
        chat_id,
        text,
        {
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
            disable_notification: false,
        }
    )
    console.log("msg send to tg!")
}


