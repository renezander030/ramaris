Today (May 2022) lots of applications exist that allow monitoring price action in the blockchain space. However, none of these I could find are free of charge or lack flexibility. Ramaris is free to use, licensed under MIT, and is flexible enough built upon a modular structure.


# Built on top of proven technologies
- ReactJS
- Next
- Typescript
- type-safety end-to-end, tRPC
- Tailwindcss
- Prisma
- Zod

# Core Features
- monitoring of blockchain transactions
- track whales
- be notified of specific transactions
- open positions for specific transactions

# Addons
- monetize a winning rule set (Bot)
- follow rule sets other users contributed

# Getting Started
Here is how you can run the app on your own.

- clone this repository  
`
git clone https://github.com/renezander030/ramaris.git
`
- install dependencies for the ui component  
`
cd ramaris  
yarn install
`
- install dependencies for the blockchain component  
`
cd src/blockchain  
yarn install
`
- create an account with Ankr, deposit tokens and put the api endpoint for the Polygon mainnet including your api key in the env.local file  
`
    ANKR_URL_POLYGON_MAINNET_WEBSOCKET=
    ANKR_API_KEY=
`
asdf
- create a free account with Alchemy and put the api credentials for the Polygon mainnet in the env.local file  
`
ALCHEMY_BASE_URL_POLYGON_MAINNET=
`
- get free tier database from supabase
- add the connection string to the env files for both components  
`
DATABASE_URL=
`
- seed the database  
`
cd ramaris  
npx prisma db execute --file .\database\pglisten.sql
`
- start the application  
In the root folder for both applications you can use the same command to start the application.
`
npm start
`


# MIT License
Copyright (c) 2023 Rene Zander

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
