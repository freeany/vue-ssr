const Vue = require('vue')
const express = require('express')

const renderer = require('vue-server-renderer').createRenderer()
const server = express()

server.get('/', (req, res) => {
  const app = new Vue({
    template: `
      <div id="app">
        <h1>{{message}}</h1>
      </div>
    `,
    data: {
      message: 'vue-ssr放肆'
    }
  })

  renderer.renderToString(app, (err, html) => {
    if (err) {
      return res.status(500).end('server interal is error')
    }
    res.setHeader('Content-Type', 'text/html;charset=utf8')
    res.send(
      `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
      </head>
      <body>
        ${html}
      </body>
      </html>`
    )
  })
})

server.listen(3000, () => {
  console.log('server running in 3000...')
})
