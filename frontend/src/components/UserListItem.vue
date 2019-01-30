<template>
<tr>
  <td>{{ user }}</td>
  <td>
      <FollowButton v-bind:user="user" />
  </td>
</tr>
</template>

<script>
import Backend from '@/Backend'
import FollowButton from '@/components/FollowButton.vue'

export default {
  name: 'UserListItem',
  components: {
    FollowButton,
  },
  props: ['user'],
}
</script>
