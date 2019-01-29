<template>
  <div class="home">
    <button v-on:click="squeakButton()">Squeak</button>
    <TimelineItem v-for="squeak in squeaks" :squeak="squeak" />
  </div>
</template>

<script>
// @ is an alias to /src
import TimelineItem from '@/components/TimelineItem.vue'
import Backend from '@/Backend'

export default {
  name: 'home',
  components: {
    TimelineItem,
  },
  data: function() {
    return {
      squeaks: null
    }
  },
  async mounted () {
    this.squeaks = await Backend.squeaks()
  },
  methods: {
    squeakButton() {
      this.$router.push('compose')
    }
  }
}
</script>
