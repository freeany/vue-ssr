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

> 修改资源文件后自动构建， 自动刷新浏览器。