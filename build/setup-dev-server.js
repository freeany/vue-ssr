const chokidar = require('chokidar')
const path = require('path')
const fs = require('fs')
const webpack = require('webpack')
const serverWebpackConfig = require('./webpack.server.config')
const devMiddleWare = require('webpack-dev-middleware') // 最新是v4版本的，这里降版本到了3.7.2版本

// 抽离出path
const resolve = file => path.resolve(__dirname, file)

module.exports = (server, callback) => {
  let ready
  const onReay = new Promise(r => ready)

  // 监视构建 --》 更新Renderer

  let template
  let serverBundle
  let clientManifest

  // 什么时候调用update呢, 当template、serverBundle、clientManifest发生改变时。
  const update = () => {
    // 等到这三个资源全都构建出来了，才会执行callback生成renderer渲染器，并且resovle setupDevServer函数
    if (template && serverBundle && clientManifest) {
      ready() // resolve
      callback(serverBundle, template, clientManifest)
    }
  }

  // 监视构建template --》 调用update  --》 更新renderer
  const templatePath = resolve('../index.template.html')
  const templateStr = fs.readFileSync(templatePath, 'utf-8')
  // console.log(templateStr)
  chokidar.watch(templatePath).on('change', () => {
    console.log('wenjiangaibianle..')
    update()
  })

  // 监视构建serverBundle --》 调用update  --》 更新renderer
  // 需要使用webpack重新构建出vue-ssr-server-bundle.json也就是serverBundle， 然后调用update

  const webpackComplier = webpack(serverWebpackConfig)
  // 使用了webpack-dev-middleware， webpack-dev-middleware也具有监视的作用
  const serverDevMiddleWare = devMiddleWare(webpackComplier, {
    logLevel: 'silent' //关闭日志输出, 由friendly-errors-webpack-plugin统一管理日志输出
  })
  // 上面的代码根据webpack的配置进行了打包和监视， 那么怎样获取到打包后的结果呢？使用hook钩子
  webpackComplier.hooks.done.tap('server', () => {
    // 拿到webpack打包后的结果, 这读取的是dev-middleware内部的内存系统中的文件
    serverBundle = JSON.parse(
      serverDevMiddleWare.fileSystem.readFileSync(
        resolve('../dist/vue-ssr-server-bundle.json'),
        'utf-8'
      )
    )
    console.log(serverBundle, 'asdad')
    update()
  })

  // 未使用webpack-dev-middleware, 使用的是普通的watch方法
  // webpackComplier.watch({}, (err, stats) => {
  //   if (err) throw err // 如果webpack打包出现了内部错误，比如说配置问题及其他内部错误，直接抛出异常
  //   // console.log(stats)
  //   if (stats.hasErrors()) return // 如果我们本身的源代码出现了问题，那么直接return就好，不需要抛出错误
  //   // 在这个回调中能拿到最新的打包后的结果vue-ssr-server-bundle.json， 需要读取该文件，注意读取该文件不能使用require，因为require有缓存，使用fs.readFileAsync读取然后json.parse拿到这个对象。
  //   /// 读取磁盘中的数据， 一般来说读写磁盘上的数据是相对比较慢的，而且是频繁读写。所以我们可以采用将打包后的结果存放到内存的方式，可以极大的提高构建速度， 可以使用官方推荐的webpack-dev-middleware
  //   serverBundle = JSON.parse(
  //     fs.readFileSync(resolve('../dist/vue-ssr-server-bundle.json'))
  //   )
  //   console.log(serverBundle)
  // })
  // end

  // 调用webpack的watch方法会自动执行构建，并监视文件的变化进行重新构建

  // 监视构建clientManifest --》 调用update  --》 更新renderer

  return onReay
}
