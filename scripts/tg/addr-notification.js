const { TelegramClient } = require('messaging-api-telegram')
require('dotenv').config()

module.exports = async (text, tgGroupName) => {
    if (text.indexOf('Big') > -1 && tgGroupName !== 'SECRET') {
        return
    }

    const config = process.env
    if (!config.TELEGRAM_ADDRESS_BOT_KEY) {
        throw new Error('cannot find TELEGRAM_ADDRESS_BOT_KEY config')
    }

    let chat_id = config[tgGroupName]
    const client = new TelegramClient({
        accessToken: config.TELEGRAM_ADDRESS_BOT_KEY,
    })
    await client.sendMessage(chat_id, text, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        disable_notification: false,
    })
    console.log('msg send to tg!')
}
