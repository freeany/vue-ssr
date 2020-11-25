// 每次渲染中重复调用此函数.
// 我们将在此执行服务器端路由匹配 (server-side route matching) 和数据预取逻辑 (data pre-fetching logic)。
// entry-server.js
import { createApp } from './app'

export default context => {
  // 实现服务器端的路由逻辑
  // 因为有可能会是异步路由钩子函数或组件，所以我们将返回一个 Promise，
  // 以便服务器能够等待所有的内容在渲染前，
  // 就已经准备就绪。
  return new Promise((resolve, reject) => {
    const { app, router } = createApp()

    // 设置服务器端 router 的位置
    router.push(context.url) // 拿到客户端的请求路径

    // 等到 router 将可能的异步组件和钩子函数解析完
    router.onReady(() => {
      // Promise 应该 resolve 应用程序实例，以便它可以渲染
      resolve(app)
    }, reject)
  })
}
