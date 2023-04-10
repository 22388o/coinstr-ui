<template lang='pug'>
q-card.full-width.card--size
  .text-h5.q-pa-md Policies
  .row(v-for="(policy,index) in policies")
    q-item.col-12( :clickable="!!policy?.uiMetadata" :class="{'bg-grey-3 text-grey-5': !policy?.uiMetadata}" @click="onSubmit(policy)")
      q-item-section
        q-item-label
          | {{ policy.name }}
        q-item-label(caption)
          | {{ policy.description }}
    q-tooltip.bg-primary(v-if="!policy?.uiMetadata" anchor="center right" self="center end") Policy created on Coinstr-CLI
</template>
<script setup>
import {
  defineProps,
  defineEmits,
  toRefs,
  toRaw,
  ref
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
.card--size
  max-height 70%
  overflow-y auto
</style>
