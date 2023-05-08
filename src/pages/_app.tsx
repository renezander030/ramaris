import { Session } from "next-auth";
import { SessionProvider, useSession } from "next-auth/react";
import type { AppProps } from "next/app";
import Head from 'next/head';
import '../css/style.css';
import '../css/multiRangeSlider.css'
import React, { ReactElement } from 'react';
import superjson from 'superjson';
import { AppRouter } from '../server/routers/_app';
import { withTRPC } from '@trpc/next';
import { httpBatchLink } from '@trpc/client/links/httpBatchLink'
import { splitLink } from '@trpc/client/links/splitLink';
import { httpLink } from '@trpc/client/links/httpLink';
import Menu from '../components/Menu';
import Link from 'next/link';
import Image from 'next/image';
import { NextComponentType } from "next";

interface AuthState {
  auth: Boolean
};

interface CustomAppProps extends AppProps {
  Component: NextComponentType & { auth?: boolean }
  pageProps: {
    session: Session
  }
}

function MyApp({ Component, pageProps: { session, ...pageProps } }: CustomAppProps) {

  // function MyApp({ Component, pageProps }: AppProps<{
  //   session: Session;
  // }>) {


  // const AuthState = Component.auth as AuthState;

  return (
    <SessionProvider session={session}>
      <Head>
        <title>ramaris</title>
        <meta charSet="UTF-8" />
        <meta name="description" content="ramaris" />
        <meta name="keywords" content="ramaris, blockchain" />
        <meta name="author" content="Rene Zander" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no" />
        <meta httpEquiv="x-ua-compatible" content="ie=edge" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
        <meta name="msapplication-TileColor" content="#00aba9" />
        <meta name="theme-color" content="#ffffff" />
      </Head>

      <div className="min-h-screen">


        {/* Header */}
        {/* logo */}
        <Link href="/browse/wallets">
          <div className="flex items-stretch justify-center">
            <div className="py-0 px-2 cursor-pointer">
              <Image className="logo" height="80" width="80" src="/logo.png" alt="ramaris" />
              <span style={{ display: "none" }}>ramaris</span>
            </div>
            <div className="py-5 cursor-pointer">
              <div className="flex space-x-2 justify-center relative">
                <h1 className="font-mono mb-3 text-3xl tracking-tight leading-none text-gray-900 md:text-2xl lg:text-2xl dark:text-white">ramaris</h1>
                {/* <span className="inline-block py-1.5 px-2.5 leading-none text-center whitespace-nowrap align-baseline font-bold bg-blue-600 text-white rounded">Alpha</span> */}
                {/* <span className="absolute -top-2 -right-14 bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded dark:bg-blue-200 dark:text-blue-800">Alpha</span> */}
                <span className="absolute -top-2 -right-14 text-xs inline-block py-1 px-2.5 leading-none text-center whitespace-nowrap align-baseline font-bold bg-blue-600 text-white rounded">alpha</span>

              </div>
            </div>
          </div>
        </Link>

        {/* Content */}
        <div className="container">
          <main className="w-full flex flex-col flex-nowrap">

            {/* top menu */}
            <nav className="flex items-center justify-between flex-wrap bg-teal px-6 py-6">
              <Menu />

              {/* small devices */}
              {/* <div className="block lg:hidden">
                      <button className="flex items-center px-3 py-2 border rounded text-teal-lighter border-teal-light hover:text-white hover:border-white">
                        <svg className="h-3 w-3" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Menu</title><path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" /></svg>
                      </button>
                    </div> */}
            </nav>

            {/* contents */}
            <section className="lg:w-3/4 px-6 flex-1">
              {Component.auth ? (
                <Auth>
                  <Component {...pageProps} />
                </Auth>
              ) : (
                <Component {...pageProps} />
              )}
            </section>

            {/* search options */}
            {/* <aside className="lg: w-1/4">
                    sidebar
                  </aside> */}

            {/* tags */}
            {/* <aside></aside> */}

          </main>
        </div>

        {/* Footer */}
        <div className="border-t border-smoke px-8 py-4">
          <div className="flex justify-center text-grey">
            {process.env.NEXT_PUBLIC_API_URL} ©2022
          </div>
        </div>

      </div>

    </SessionProvider>
  )
}

function Auth({ children }: { children: ReactElement<any, any> }) {
  // if `{ required: true }` is supplied, `status` can only be "loading" or "authenticated"
  const { status } = useSession({ required: true })

  if (status === "loading") {
    return <div>Loading...</div>
  }

  return children
}


export default withTRPC<AppRouter>({
  config({ ctx }) {

    // if (typeof window !== 'undefined') {
    //   // during client requests
    //   return {
    //     transformer: superjson, // optional - adds superjson serialization
    //     url: '/api/trpc',
    //   };
    // }

    // optional: use SSG-caching for each rendered page (see caching section for more details)
    const ONE_DAY_SECONDS = 60 * 60 * 24;
    ctx?.res?.setHeader(
      'Cache-Control',
      `s-maxage=1, stale-while-revalidate=${ONE_DAY_SECONDS}`,
    );

    const url = process.env.NEXT_PUBLIC_API_URL
      ? `https://${process.env.NEXT_PUBLIC_API_URL}/api/trpc`
      // : 'http://192.168.0.9:3000/api/trpc';
      : 'http://localhost:3000/api/trpc';
    // const url = `http://${process.env.NEXT_PUBLIC_API_URL}:3000/api/trpc`
    // const url = 'http://localhost:3000/api/trpc'
    return {
      transformer: superjson,
      links: [
        splitLink({
          condition(op) {
            // check for context property `skipBatch`
            return op.context.skipBatch === true;
          },
          // when condition is true, use normal request
          true: httpLink({
            url,
          }),
          // when condition is false, use batching
          false: httpBatchLink({
            url,
          }),
        }),
      ],
      url,
      headers() {
        if (ctx?.req) {
          // To use SSR properly, you need to forward the client's headers to the server
          // This is so you can pass through things like cookies when we're server-side rendering
          // If you're using Node 18, omit the "connection" header
          const {
            connection: _connection,
            ...headers
          } = ctx.req.headers;
          return {
            ...headers,
            // Optional: inform server that it's an SSR request
            'x-ssr': '1',
          };
        }
        return {}
      },
    };

  },
  ssr: true,
  responseMeta({ clientErrors, ctx }) {
    if (clientErrors.length) {
      // propagate first http error from API calls
      return {
        status: clientErrors[0].data?.httpStatus ?? 500,
      };
    }
    // cache full page for 1 day + revalidate once every second
    const ONE_DAY_IN_SECONDS = 60 * 60 * 24;
    return {
      'Cache-Control': `s-maxage=1, stale-while-revalidate=${ONE_DAY_IN_SECONDS}`,
    };
  },
})(MyApp);

// export default withTRPC<AppRouter>({
//   config({ ctx }) {
//     if (typeof window !== 'undefined') {
//       // during client requests
//       return {
//         transformer: superjson, // optional - adds superjson serialization
//         url: '/api/trpc',
//       };
//     }
//     // during SSR below
//     // optional: use SSG-caching for each rendered page (see caching section for more details)
//     const ONE_DAY_SECONDS = 60 * 60 * 24;
//     ctx?.res?.setHeader(
//       'Cache-Control',
//       `s-maxage=1, stale-while-revalidate=${ONE_DAY_SECONDS}`,
//     );
//     // The server needs to know your app's full url
//     // On render.com you can use `http://${process.env.RENDER_INTERNAL_HOSTNAME}:${process.env.PORT}/api/trpc`
//     const url = process.env.VERCEL_URL
//       ? `https://${process.env.VERCEL_URL}/api/trpc`
//       : 'http://localhost:3000/api/trpc';
//     return {
//       transformer: superjson, // optional - adds superjson serialization
//       url,
//       /**
//        * Set custom request headers on every request from tRPC
//        * @link http://localhost:3000/docs/v9/header
//        * @link http://localhost:3000/docs/v9/ssr
//        */
//       headers() {
//         if (ctx?.req) {
//           // To use SSR properly, you need to forward the client's headers to the server
//           // This is so you can pass through things like cookies when we're server-side rendering
//           // If you're using Node 18, omit the "connection" header
//           const {
//             connection: _connection,
//             ...headers
//           } = ctx.req.headers;
//           return {
//             ...headers,
//             // Optional: inform server that it's an SSR request
//             'x-ssr': '1',
//           };
//         }
//         return {};
//       },
//     };
//   },
//   ssr: true,
// })(MyApp)
