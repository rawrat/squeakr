<template>
<div>
  <div id="user_list_container">
    <table>
      <UserListItem v-for="user in users" :user="user" />
    </table>
  </div>
  <div id="follow_requests_container">
    <h3>Follow Requests</h3>
    <table>
      <UserListItem v-for="user in followRequests" :user="user" />
    </table>
  </div>
</div>
</template>

<script>
import Backend from '@/Backend'
import UserListItem from '@/components/UserListItem.vue'

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
    await Backend.scatterConnect()
    this.users = await Backend.users()
    this.following = await Backend.following(Backend.account.name)
    this.followRequests = await Backend.followRequests(Backend.account.name)
    console.log("this.users: ", this.users)
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
