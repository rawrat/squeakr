<template>
<div>
  <div id="user_list_container">
    <h3>All Users</h3>
    <table>
      <UserListItem v-for="user in users" :user="user" v-on:update="update" />
    </table>
  </div>
  <div id="follow_requests_container">
    <h3>Follow Requests</h3>
    <table>
      <UserListItem v-for="user in followRequests" :user="user" :is_request="true" v-on:update="update" />
    </table>
  </div>
</div>
</template>

<script>
import Backend from '@/Backend'
import UserListItem from '@/components/UserListItem.vue'

async function reload(x) {
  await Backend.scatterConnect()
  x.users = await Backend.users()
  x.following = await Backend.following(Backend.account.name)
  x.followRequests = await Backend.followRequests(Backend.account.name)
  console.log("this.users: ", x.users)
}

export default {
  name: 'Users',
  components: {
    UserListItem,
  },
  data() {
    return {
      users: null,
      followRequests: null,
    }
  },
  async mounted() {
    reload(this)
  },
  methods: {
    update: function() {
      reload(this)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
