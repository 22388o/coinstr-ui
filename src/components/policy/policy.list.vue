<template lang='pug'>
q-card.full-width
  q-card-section
    .row(v-for="policy in policies")
      .col-12
        q-card
          q-card-section
            q-item.cursor-pointer(clickable)
              q-item-section
                q-item-label
                  | {{ policy.name }}
                q-item-label.caption
                  | {{ policy.description }}
              q-item-section
                q-btn(
                  color="primary"
                  label="Edit"
                  @click="onSubmit"
                )
</template>
<script setup>
import {
  defineProps,
  defineEmits
} from 'vue'
// props
const props = defineProps({
  policies: {
    type: Array,
    default: () => []
  }
})
// Emits
const emits = defineEmits(['onSubmit'])
// Methods by Feature
const onSubmit = emits('onSubmit')
</script>
<style lang='stylus' scoped>
</style>
