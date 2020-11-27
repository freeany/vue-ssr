// 每次渲染中重复调用此函数.
// 我们将在此执行服务器端路由匹配 (server-side route matching) 和数据预取逻辑 (data pre-fetching logic)。
// entry-server.js
import { createApp } from './app'
const { app, router, store } = createApp()
const meta = app.$meta() // here

export default context => {
  // 实现服务器端的路由逻辑
  // 因为有可能会是异步路由钩子函数或组件，所以我们将返回一个 Promise，
  // 以便服务器能够等待所有的内容在渲染前，
  // 就已经准备就绪。
  return new Promise((resolve, reject) => {
    // 设置服务器端 router 的位置
    router.push(context.url) // 拿到客户端的请求路径
    context.meta = meta // and here
    // 等到 router 将可能的异步组件和钩子函数解析完
    router.onReady(() => {
      // 在所有预取钩子(preFetch hook) resolve 后，
      // 我们的 store 现在已经填充入渲染应用程序所需的状态。
      // 当我们将状态附加到上下文，
      // 并且 `template` 选项用于 renderer 时，
      // 状态将自动序列化为 `window.__INITIAL_STATE__`，并注入 HTML。
      context.state = store.state

      // Promise 应该 resolve 应用程序实例，以便它可以渲染
      resolve(app)
    }, reject)
  })
}
