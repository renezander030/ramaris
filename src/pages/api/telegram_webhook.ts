
// endpoint telegram api talks to

// import logger from '../../utils/logger'
import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult, NextApiRequest, NextApiResponse } from 'next';
import { ParsedUrlQuery } from 'querystring';

const TELEGRAM_BASE_URL = `https://api.telegram.org/bot`;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_HTTP_ENDPOINT = `${TELEGRAM_BASE_URL}${TELEGRAM_BOT_TOKEN}`


type Props = {
    data: {
        chat_id: string;
        text: string;
    }
};

type ReceivedMessage = {
    message: {
        chat: {
            id: number
        },
        text: string;
        from: {
            id: number;
        }
    }
}



// this function only runs on the server-side
// only allowed to be called from telegram servers
export const getServerSideProps: GetServerSideProps<Props> = async (
    context
) => {

    const forwarded = context.req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string' ? forwarded.split(/, /)[0] : context.req.socket.remoteAddress;


    // restricts incoming connections to telegram servers
    if (!ip?.match(/91.108.4|91.108.5|91.108.6|91.108.7/g)) {

        console.log('new request serverside blocked')
        console.log(context.req.socket.remoteAddress)
        return {
            props: { data: {} }
        }
    }

    // debug
    // console.log(context.query)


    interface TelegramQuery {
        chat: {
            id: string
        },
        text: string,
        from:{
            id: string
        }
    }

    let { chat, text, from }: TelegramQuery = context.query.message as unknown as TelegramQuery;

    // trims message to max of 4096 chars
    text = text?.toString().substring(0, 4095);


    // user wants to register, get his chat id
    if (text.match(/\/register/gi)) {

        const Message = {
            chat_id: chat.id,
            text: `Your chat id is ${chat.id}. Once your chat id has been set on your profile page you are able to receive notifications from ramaris.`,
        }

        const response = await fetch(`${TELEGRAM_HTTP_ENDPOINT}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(Message)
        })
        const data = await response.json();

        return {
            props: { data },
        };


    } else { // default answer
        // const Message = {
        //     chat_id: chat_id,
        //     text: 'Hello👋 Welcome to Ramaris. You can use the menu to see available commands.',
        // }
        // const response = await fetch(`${TELEGRAM_HTTP_ENDPOINT}/sendMessage`, {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify({})
        // })
        // const data = await response.json();

        return {
            props: { data: {} },
        };
    }
};


// client-side run
// forwards contents sent from telegram api to server-side
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<any>
) {
    const result = await getServerSideProps({
        req,
        res,
        resolvedUrl: '/api/telegram_webhook', // replace with your API route URL
        query: req.body,
    });

    if (result instanceof Promise) {
        const props = await result;
        const data = props.data;

        res.status(200).json(data);
    } else {
        res.status(200).json({});
    }
}