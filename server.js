const Vue = require('vue')
const express = require('express')
const fs = require('fs')
const server = express()

// 判断是开发环境还是生产环境
const isPro = process.env.NODE_ENV === 'production'
const { createBundleRenderer } = require('vue-server-renderer')

const setupDevServer = require('./build/setup-dev-server')

// createRenderer可以传递一个template参数作为模板
let renderer // 定义渲染器
let onReady // setupDevServer返回的promise对象，当这个promise resolve的时候，就代表最新的渲染器拿到了。
if (isPro) {
  const serverBundle = require('./dist/vue-ssr-server-bundle.json')
  const clientManifest = require('./dist/vue-ssr-client-manifest.json')
  const template = fs.readFileSync('./index.template.html', 'utf-8')
  renderer = createBundleRenderer(serverBundle, {
    template,
    clientManifest
  })
} else {
  // 开发模式 --》 监视打包构建  --》 重新生成 Renderer 渲染器
  // 这个函数用来生成renderer渲染器, 这三个参数 获取的都是代码改变后打包后的最新的数据， 使用callback的形式使用最新的数据创建渲染器。
  // 那么我下面需要使用到这个渲染器，怎么能知道最新的渲染器渲染完毕，我要使用呢， 使用promise
  onReady = setupDevServer(server, (serverBundle, template, clientManifest) => {
    renderer = createBundleRenderer(serverBundle, {
      template,
      clientManifest
    })
  })
}

// 将打包后的文件转换成静态资源文件, 这样才可以正确读取
server.use('/dist', express.static('./dist'))

const render = (req, res) => {
  // 这里的html是 createRenderer 中配置的模板 + vue中template解析后的结果, 所以可以直接返回
  // 想要去渲染meta标签, 使用renderToString函数的第二个参数
  renderer.renderToString(
    {
      title: 'vue-ssr放肆',
      meta: `
      <meta name="半城烟沙" description="秉林赤侠">
      <meta name="残迹裂甲" description="普泓天涯">
    `
    },
    (err, html) => {
      if (err) {
        return res.status(500).end('server interal is error')
      }
      res.setHeader('Content-Type', 'text/html;charset=utf8')
      res.send(html)
    }
  )
}

// 这里不用 传入vue应用实例，因为在执行bundle时已经自动创建过. , 此时服务器与客户端已经解耦
// 如果是生产环境，则可以直接使用render， 因为开发模式是直接打包的，但是开发环境需要监视代码，需要等待监视到代码改变后，重新构建才会生成 Renderer 渲染器，render函数才能使用 Renderer 渲染器
server.get(
  '/',
  isPro
    ? render
    : async (req, res) => {
        await onReady // 等待最新的渲染器拿到
        render()
      }
)

server.listen(3000, () => {
  console.log('server running in 3000...')
})
