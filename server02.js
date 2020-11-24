const Vue = require('vue')
const express = require('express')
const fs = require('fs')

// createRenderer可以传递一个template参数作为模板
const renderer = require('vue-server-renderer').createRenderer({
  template: fs.readFileSync('./index.template.html', 'utf-8')
})
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

  // 这里的html是 createRenderer 中配置的模板 + vue中template解析后的结果, 所以可以直接返回
  renderer.renderToString(app, (err, html) => {
    if (err) {
      return res.status(500).end('server interal is error')
    }
    res.setHeader('Content-Type', 'text/html;charset=utf8')
    res.send(html)
  })
})

server.listen(3000, () => {
  console.log('server running in 3000...')
})
