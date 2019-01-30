<template>
  <div>
    <span v-if="isMyself">That's you!</span>
    <button v-else @click="follow">Follow</button>
  </div>
</template>

<script>
import Backend from '@/Backend'

export default {
  name: 'FollowButton',
  props: ['user'],
  methods: {
    follow: function() {
      Backend.followRequest(this.user)
    }
  },
  computed: {
    isMyself: function() {
      return Backend.account.name == this.user
    }
  }
}
</script>
