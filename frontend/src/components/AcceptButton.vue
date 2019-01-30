<template>
  <button @click="accept">Accept</button>
</template>

<script>
import Backend from '@/Backend'


export default {
  name: 'AcceptButton',
  props: ['user'],
  methods: {
    accept: async function() {
      await Backend.accept(this.user.follower)
      this.$parent.$emit('update')
    }
  },
  computed: {
  }
}
</script>
