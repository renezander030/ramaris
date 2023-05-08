
// route called from profile page
// allows to test the connection

// import logger from '../../utils/logger'
import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult, NextApiRequest, NextApiResponse } from 'next';

const TELEGRAM_BASE_URL = `https://api.telegram.org/bot`;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_HTTP_ENDPOINT = `${TELEGRAM_BASE_URL}${TELEGRAM_BOT_TOKEN}`


type Props = {
  data: {
    chat_id: string;
    message: string;
  }
};

// this function only runs on the server-side
// only allowed to be called from localhost
export const getServerSideProps: GetServerSideProps<Props> = async (
  context
) => {

  const forwarded = context.req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(/, /)[0] : context.req.socket.remoteAddress;

  console.log(`new request from ${ip} forwarded for ${forwarded}`)

  // restricts incoming connections to localhost
  // if (!ip?.match(/::1/g)) {

  //   console.log('new request serverside blocked')
  //   return {
  //     props: { data: {} }
  //   }
  // }


  let {
    message,
    chat_id
  } = JSON.parse(context.query.toString())


  // trim message to max of 4096 chars
  if (message) {
    message = message.toString().substring(0, 4095);
  }

  const Message = {
    chat_id: chat_id,
    text: message
  }

  const response = await fetch(`${TELEGRAM_HTTP_ENDPOINT}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(Message)
  });

  const data = await response.json();


  return {
    props: { data },
  };
};


// client-side run
// returns answer from telegram after sendMessage method was called
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {

  // console.log('new request incoming')
  // console.log(req)

  const result = await getServerSideProps({
    req,
    res,
    resolvedUrl: '/api/telegram_sendMessage', // replace with your API route URL
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