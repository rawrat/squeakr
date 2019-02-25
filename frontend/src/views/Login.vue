<template>
<div id="login_container">
  <form v-on:submit.prevent="onSubmit">
    <input v-model="username" /> <br />
    <input v-model="password" /> <br/>
    <button type="submit">Submit</button>
  </form>
</div>
</template>

<script>
import Backend from '@/Backend'

export default {
  name: 'Login',
  data() {
    return {
      username: "",
      password: "",
    }
  },
  methods: {
    onSubmit: async function() {
      console.log('submit ', this.username)
      await Backend.login(this.username, this.password)
      this.$router.push('/')
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
