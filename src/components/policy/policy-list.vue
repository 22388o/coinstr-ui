<template lang='pug'>
q-card.full-width
  .text-h5.q-pa-md Policies
  .row(v-for="(policy,index) in policies")
    q-item.col-12(clickable @click="onSubmit(policy)")
      q-item-section
        q-item-label
          | {{ policy.name }}
        q-item-label(caption)
          | {{ policy.description }}
</template>
<script setup>
import {
  defineProps,
  defineEmits,
  toRefs,
  toRaw
} from 'vue'
// props
const props = defineProps({
  policies: {
    type: Array,
    default: () => []
  }
})
const { policies } = toRefs(props)
// Emits
const emits = defineEmits(['onSubmit'])
// Methods by Feature
const onSubmit = (policy) => {
  emits('onSubmit', toRaw(policy))
}
</script>
<style lang='stylus' scoped>
</style>
