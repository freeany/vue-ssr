<template>
  <div id="app">
    <h1>{{ message }}</h1>
    <h2>客户端动态交互123</h2>
    <h3 v-text="message"></h3>
    <div>
      <input v-model="message" />
    </div>
    <div>
      <button @click="onClick">点击测试</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  data () {
    return {
      message: 'vue-ssr',
    }
  },
  methods: {
    onClick () {
      console.log('hello world')
    }
  }

}
</script>

<style>
</style>
