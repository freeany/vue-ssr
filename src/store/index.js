import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
Vue.use(Vuex)

export const createStore = () => {
  return new Vuex.Store({
    state: {
      posts: []
    },
    mutations: {
      setPosts(state, payload) {
        state.posts = payload
      }
    },
    actions: {
      // actions中每一个函数都要返回一个promise对象
      async getPosts({ commit }) {
        const { data } = await axios.get(
          'https://jsonplaceholder.typicode.com/posts'
        )
        commit('setPosts', data)
      }
    }
  })
}
