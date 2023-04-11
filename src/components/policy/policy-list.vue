<template lang='pug'>
q-card.full-width.card--size.bg-secondary
  .text-h5.q-pa-md.text-center.text-white Policies
  q-input.c-input.c-input-bg.q-px-md(
    v-model="search"
    debounce="300"
    outlined
    dense
    color="primary"
    placeholder="Search"
    hide-bottom-space
  )
  q-scroll-area(style="height: 85%" dark)
    q-list.q-pa-md(padding v-if="policiesFiltered.length > 0")
      q-item.item--bordered.q-pa-md(
        v-for="(policy,index) in policiesFiltered"
        :clickable="!!policy?.uiMetadata"
        :class="{'bg-grey-9 text-grey-6': !policy?.uiMetadata, 'text-white': policy?.uiMetadata}"
        :key="policy?.descriptor"
        @click="onSubmit(policy)"
      )
        q-item-section
          q-item-label
            | {{ policy?.name }}
          q-item-label(caption :class="{'text-grey-6': !policy?.uiMetadata, 'text-white': policy?.uiMetadata}")
            | {{ policy?.description }}
        q-tooltip.bg-primary(
          v-if="!policy?.uiMetadata"
          anchor="center right"
          self="center end"
          transition-show="fade"
          transition-hide="fade"
          transition-duration="300"
          :delay="500"
          ) Policy created on Coinstr-CLI
    div.text-white(v-else)
      q-card.full-width.card--size.bg-secondary(flat)
        .text-h5.q-pa-md.text-center.text-white.q-pt-md No policies found
</template>
<script setup>
import {
  defineProps,
  defineEmits,
  toRefs,
  toRaw,
  ref,
  computed
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
const search = ref(undefined)
const policiesFiltered = computed(() => {
  if (!search.value) return policies.value

  const filtered = policies.value.filter((policy) => {
    return policy.name.toLowerCase().includes(search.value.toLowerCase()) ||
           policy.description.toLowerCase().includes(search.value.toLowerCase())
  })
  return filtered
})
// Methods by Feature
const onSubmit = (policy) => {
  emits('onSubmit', toRaw(policy))
}
</script>
<style lang='stylus' scoped>
@import '~/css/colors.styl'
.card--size
  height: 80%
  overflow-y: hidden
.item--bordered
  border 1px solid $grayDark2
  &:first-child
    border-radius: 0.5rem 0.5rem 0 0;
    border: 1px solid $grayDark2
  &:last-child
    border-radius: 0px 0px 0.5rem 0.5rem;
    border: 1px solid $grayDark2
</style>
