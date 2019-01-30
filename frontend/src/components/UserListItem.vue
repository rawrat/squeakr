<template>
<tr>
  <td v-if="user.user">{{ user.user }}</td>
  <td v-else-if="user.follower">{{ user.follower }}</td>
  <td>
      <AcceptButton v-if="is_request" v-bind:user="user" />
      <FollowButton v-else v-bind:user="user" />
  </td>
</tr>
</template>

<script>
import Backend from '@/Backend'
import FollowButton from '@/components/FollowButton.vue'
import AcceptButton from '@/components/AcceptButton.vue'

export default {
  name: 'UserListItem',
  components: {
    FollowButton,
    AcceptButton,
  },
  props: ['user', 'is_request'],
}
</script>
