// 客户端 entry 只需创建应用程序，并且将其挂载到 DOM 中：
import { createApp } from './app'

// 客户端特定引导逻辑……

const { app, router } = createApp()

// 这里假定 App.vue 模板中根元素具有 `id="app"`
// 需要在挂载 app 之前调用 router.onReady，因为路由器必须要提前解析路由配置中的异步组件，才能正确地调用组件中可能存在的路由钩子
router.onReady(() => {
  app.$mount('#app')
})
