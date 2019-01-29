<template>
  <div class="home">
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
  }
}
</script>
