### nodejs中解析vue实例模板

- 使用vue-server-renderer将template模板

  ```html
  <div id="app">
      <h1>{{message}}</h1>
  </div>
  ```

  转换成

  ```html
  <div id="app" data-server-rendered="true"><h1>vue-ssr</h1></div>
  ```

  `data-server-rendered="true"`的作用是用于将来客户端渲染激活接管渲染的一个入口。

### 结合服务器将template返回给客户端

- 新建index.template.html

  ```html
  <body>
    <!--vue-ssr-outlet-->
  </body>
  ```

- server端

  ```js
  // createRenderer可以传递一个template参数作为模板
  const renderer = require('vue-server-renderer').createRenderer({
    template: fs.readFileSync('./index.template.html', 'utf-8')
  })
  ```

  ```js
  // 这里的html是 createRenderer 中配置的模板 + vue中template解析后的结果, 所以可以直接返回
  renderer.renderToString(app, (err, html) => { }
  ```

### 添加meta标签

- template

  ```html
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    {{{ meta }}}  // 这里需要使用三个大括号
    <title>{{ title }}</title>
  </head>
  ```

- server.js

  ```js
  // 想要去渲染meta标签, 使用renderToString函数的第二个参数
  renderer.renderToString(
      app,
      {
          title: 'vue-ssr放肆',
          meta: `
              <meta name="半城烟沙" description="秉林赤侠">
              <meta name="残迹裂甲" description="普泓天涯">
              `
      },
  ```

### 服务端返回页面，客户端交互

- 服务端只返回了静态页面，需要客户端对静态页面进行接管然后才可以进行交互。现在有了服务端入口，但是还需要客户端入口，否则无法进行客户端渲染，接管服务端返回的页面，激活成一个动态页面。这是同构应用的基本流程。

  ```html
  // 编写通用 的 源码结构
  https://ssr.vuejs.org/zh/guide/structure.html#%E4%BD%BF%E7%94%A8-webpack-%E7%9A%84%E6%BA%90%E7%A0%81%E7%BB%93%E6%9E%84
  ```



### 配置webpack配置文件及其打包命令

build:client 打包出的vue-ssr-client-manifest.json是客户端打包的资源的构建清单。

build:server 打包出的vue-ssr-server-bundle.json



### 启动应用

- 使用打包后的资源启动同构应用

  ```js
  const serverBundle = require('./dist/vue-ssr-server-bundle.json')
  const clientManifest = require('./dist/vue-ssr-client-manifest.json')
  const template = fs.readFileSync('./index.template.html', 'utf-8')
  const renderer = require('vue-server-renderer').createBundleRenderer(
    serverBundle,
    {
      template,
      clientManifest
    }
  )
  ```

  ```js
  https://ssr.vuejs.org/zh/guide/bundle-renderer.html
  ```

### 解析渲染流程

> 两个层面

1. 服务端渲染是如何返回客户端所书写的代码结构的。

   - vue-ssr-server-bundle.json   服务端打包后的结果

     ```js
     "entry": "server-bundle.js",
     "files": {
         "server-bundle.js": webpack.server.config.js打包后的结果文件
     },
     "maps": { ... } // sorce-map的相关信息，比较适合用于开发调试上。
     ```

   - 渲染

     createBundleRenderer(serverBundle, {template，clientManifest } ) // 对打包后的结果(vue实例)进行渲染， 注入到了template模板上。把数据(页面)发送给了客户端。发送给客户端的同时还引入了激活的脚本，也就是客户端打包后的文件， 构建资源相关信息就是clientManifest 。

2. 客户端是如何接管和激活服务端返回的页面的。

   > 所谓客户端激活，指的是 Vue 在浏览器端接管由服务端发送的静态 HTML，使其变为由 Vue 管理的动态 DOM 的过程.

   服务端返回的页面根元素是`<div id="app" data-server-rendered="true">`

   - `data-server-rendered` 特殊属性，让客户端 Vue 知道这部分 HTML 是由 Vue 在服务端渲染的，并且应该以激活模式进行挂载。

### 构建配置的开发模式

> 1. 修改资源文件后自动构建， 2. 自动刷新浏览器。

当文件发生改变时，使用监视的方式去监听代码的改变，而监视到改变的通知方式都是通过回调或者钩子的形式拿到最新的资源文件。所以可以说是异步的，非同步。定义update方法

```js
const update = () => {
    // 等到这三个资源全都构建出来了，才会执行callback生成renderer渲染器，并且resovle setupDevServer函数
    if (template && serverBundle && clientManifest) {
        ready() // resolve promise resolve说明可以进行render了
        // ps: 先执行callback，在执行resolve后.then中的函数
        callback(serverBundle, template, clientManifest) // 拿到渲染器
    }
}
```

- 监视index.template.html文件

  ```js
  // 监视构建template --》 调用update  --》 更新renderer
  const templatePath = resolve('../index.template.html')
  template = fs.readFileSync(templatePath, 'utf-8')
  update()
  // 使用chokidar包监视文件变化，chokidar包封装了fs的watch模块
  chokidar.watch(templatePath).on('change', () => {
      template = fs.readFileSync(templatePath, 'utf-8')
      update()
  })
  ```

- 监视webpack.server.config.js 需要打包的文件，如果文件改变重新打包，然后拿到内存中的数据， 因为打包到了内存中

  ```js
  const devMiddleWare = require('webpack-dev-middleware')
  // 监视构建serverBundle --》 调用update  --》 更新renderer
  const webpackServerComplier = webpack(serverWebpackConfig)
  // 使用了webpack-dev-middleware， webpack-dev-middleware也具有监视的作用
  const serverDevMiddleWare = devMiddleWare(webpackServerComplier, {
      logLevel: 'silent' //关闭日志输出, 由friendly-errors-webpack-plugin统一管理日志输出
  })
  // 上面的代码根据webpack的配置进行了打包和监视， 那么怎样获取到打包后的结果执行update钩子呢呢？使用hook钩子
  webpackServerComplier.hooks.done.tap('server', () => {
      // 拿到webpack打包后的结果, 这读取的是dev-middleware内部的内存系统中的文件
      serverBundle = JSON.parse(
          serverDevMiddleWare.fileSystem.readFileSync(
              resolve('../dist/vue-ssr-server-bundle.json'),
              'utf-8'
          )
      )
      update()
  })
  ```

- 监视webpack.client.config.js 同上，不过因为客户端需要加载script脚本，该脚本文件是静态文件，但是express.static 读取的是磁盘上的文件，但我们使用webpack-dev-middle后的文件是打包到内存中的，所以要加上这一句话

  ```js
  // 将 clientDevMiddleware 挂载到 Express 服务中，提供对其内部内存中数据的访问
  server.use(clientDevMiddleWare)
  ```

- > 以上操作完毕，便有了监视文件变化然后重新打包的功能，但是浏览器不会自动刷新， 为了保证更好的体验，需要加入热更新的逻辑.

  ```js
  // 先处理配置，再编译配置
  clientWebpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin())
  clientWebpackConfig.entry.app = [
      'webpack-hot-middleware/client?quiet=true&reload=true', // 和服务端交互处理热更新一个客户端脚本, 后面的参数quiet是不向控制台输出内容，reload是如果更新的过程卡住了，则强制刷新
      clientWebpackConfig.entry.app
  ]
  clientWebpackConfig.output.filename = '[name].js' // 热更新模式下确保一致的 hash
  ```

  服务器端加入hot-middleware中间件

  ```js
  server.use(
      hotMiddleware(webpackClientComplier, {
          log: false // 关闭它本身的日志输出
      })
  )
  ```



### 加入vue-router

```bash
https://ssr.vuejs.org/zh/guide/routing.html#%E4%BD%BF%E7%94%A8-vue-router-%E7%9A%84%E8%B7%AF%E7%94%B1
```

重写render函数

```js
const render = async (req, res) => {
  try {
    const html = await renderer.renderToString({
      title: 'vue-ssr-d',
      url: req.url // important这行代码会去去调用entry-server.js return 的promise
    })
    res.setHeader('Content-Type', 'text/html;charset=utf8')
    res.end(html)
  } catch (err) {
    return res.status(500).end('server interal is error')
  }
}
```

- 当浏览器输入地址(客户端路由)时，执行render函数， render函数拿到req.url。 将url放到渲染器的参数中， 然后会去执行entry-server.js 导出的函数，之后就是内部执行....

router.js

```js
    mode: 'history', // 服务端不接受hahs模式，因为他不接受hash这种url格式作为服务端路由进行处理
    routes: [
      {
        path: '/',
        component: Home
      },
      {
        name: 'Home',
        path: '/home',
        component: Home
      },
      {
        name: 'About',
        path: '/about',
        component: () => import('@/views/about')
      },
      {
        name: 'Error404',
        path: '*',
        component: () => import('@/views/404')
      }
    ]
```

访问首页 请求加载了所有的路由(即时是被分割的路由)所对应的js，但仅仅是加载而不是执行。

在html 的head头部加载了

```js
<link rel="preload" href="/dist/app.51c300fb70e05cdafa9f.hot-update.js" as="script">
<link rel="prefetch" href="/dist/0.js"> // 加载的是在下一个页面可能的页面，prefetch只会在浏览器空闲的时候加载。
<link rel="prefetch" href="/dist/1.js">
```

如果是

```js
<script charset="utf-8" src="/dist/1.js"></script>
```

这样的代码， 那么浏览器会去加载js文件并阻塞页面去执行js文件，但是如果是link的形式则不会执行js而是先加载到本地。

当我们访问其他路由时，会发现在head标签中多了这么一行代码`<script charset="utf-8" src="/dist/1.js"></script>`

在network中出现了这么一个请求。

```js
Request URL: http://localhost:3000/dist/1.js
Status Code: 200 OK (from prefetch cache) // 来自预取缓存
```

### 管理head内容

> 使用vue-meta

vue-meta在nuxtjs中的使用

`https://vue-meta.nuxtjs.org/`