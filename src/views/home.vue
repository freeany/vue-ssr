<template>
  <div>
    <h1>home pages</h1>
    <h2>{{ msg }}</h2>
  </div>
</template>

<script>
export default {
  name: 'homePage',
  metaInfo: {
    title: '首页',
    meta: [
      { description: 'about页面', name: 'about' }
    ]
  },
  data () {
    return {
      msg: 'zxc'
    }
  },
  beforeCreate () {
    // console.log('aa')
  },
  created () {
    // console.log('??')
    // this.msg = '123'
  },
  mounted () {
    // console.log('mmm')
  }
}
</script>

<style>
</style>
