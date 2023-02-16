import logger from '../../utils/logger'

const TELEGRAM_BASE_URL = `https://api.telegram.org/bot`;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_HTTP_ENDPOINT = `${TELEGRAM_BASE_URL}${TELEGRAM_BOT_TOKEN}`

// await sendTelegramMessage(chat_id, message)
// ${TELEGRAM_HTTP_ENDPOINT}/sendMessage
// required params
// chat_id: Unique identifier for the target chat or username of the target channel (in the format @channelusername)
// text: Text of the message to be sent, 1-4096 characters after entities parsing
// optionally, apply markdown styling https://core.telegram.org/bots/api#markdownv2-style
// testing
async function sendTelegramMessage(chat_id: string, message: string) {

    // trim message to max of 4096 chars
    message = message.substring(0, 4095);

    const Message = {
        chat_id: chat_id,
        text: message
    }
    // send
    const response = await fetch(`${TELEGRAM_HTTP_ENDPOINT}/sendMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(Message)
    });
    return response.json();
}

// POST /api/telegram
// receives HTTP POST update object from Telegram
// https://core.telegram.org/bots/api#update
// https://core.telegram.org/bots/api#setwebhook
export default async function handle(req: { body?: any; rawHeaders?: any; }, res: { json: (arg0: { data: string; }) => void; }) {
    const {
        update_id,
        message,
        edited_message,
        channel_post,
        edited_channel_post,
        inline_query,
        chosen_inline_result,
        callback_query,
        shipping_query,
        pre_checkout_query,
        poll,
        poll_answer,
        my_chat_member,
        chat_member,
        chat_join_request
    } = req.body;
    const { rawHeaders } = req;

    /*
        user subscribes to bots and wallets
            ramaris: sends update to user, subscribe was successful
    */
    const chatId = '123';
    await sendTelegramMessage(chatId, "Subscribe to XYZ successful🚀")
    
    /*
    user UN-subscribes from bots and wallets
    ramaris: sends update to user, subscribe was successful
    */
   await sendTelegramMessage(chatId, "You successfully unsubscribed from XYZ👋")


    const result = {
        data: `hello from api telegram`
    }

    // logger.log('info', `rawHeaders ${rawHeaders}`);
    logger.log('info', `${message}`);
    res.json(result);
}
