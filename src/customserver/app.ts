const {
  createServer
} = require('http')
const {
  parse
} = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({
  dev,
  hostname,
  port
})
const handle = app.getRequestHandler()

// serve public folder static files
const express = require('express');
const server = express();
const path = require('path');

app.prepare().then(() => {

  server.use('/', express.static(path.join(__dirname, 'src/public')));

  createServer(async (req: { url: any }, res: { statusCode: number; end: (arg0: string) => void }) => {
    try {
      // Be sure to pass `true` as the second argument to `url.parse`.
      // This tells it to parse the query portion of the URL.
      const parsedUrl = parse(req.url, true)
      const {
        pathname,
        query
      } = parsedUrl

      if (pathname === '/a') {
        await app.render(req, res, '/a', query)
      } else if (pathname === '/b') {
        await app.render(req, res, '/b', query)
      } else {
        await handle(req, res, parsedUrl)
      }
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  }).listen(port, (err: Error) => {
  // }).listen(port, "0.0.0.0", (err: Error) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})

export {}