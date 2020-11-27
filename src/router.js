// router.js
import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/views/home'

Vue.use(Router)

export function createRouter() {
  return new Router({
    mode: 'history', // 服务端不接受hahs模式，因为他不接受hash这种url格式作为服务端路由进行处理
    routes: [
      {
        path: '/',
        // redirect: '/home'
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
        name: 'Posts',
        path: '/posts',
        component: () => import('@/views/Posts')
      },
      {
        name: 'Error404',
        path: '*',
        component: () => import('@/views/404')
      }
    ]
  })
}
