<template lang='pug'>
q-card.full-width.bg-secondary
  q-card-section
    .row.justify-center.text-h5.q-pl-lg.q-py-lg.text-white Policy Form
    q-form(ref="form")
      q-input.c-input.c-input-bg.q-py-md.q-px-lg(
        outlined
        v-model="policy.name"
        label="Policy name"
        dark
        :rules="[rules.required]"
      )
      q-input.c-input.c-input-bg.q-py-md.q-px-lg(
        outlined
        v-model="policy.description"
        label="Policy description"
        dark
        :rules="[rules.required]"
      )
      q-btn.btn--rounded.q-my-md.q-mx-lg(
        label="Save"
        color="primary"
        no-caps
        @click="savePolicy"
      )
</template>
<script setup>
import {
  reactive,
  ref,
  defineEmits
} from 'vue'
import { useValidations } from '~/composables'
// props

// Emits
const emits = defineEmits(['onSubmit'])
// Methods by Feature
const { rules } = useValidations()

const policy = reactive({
  name: undefined,
  description: undefined
})

const form = ref(null)
const savePolicy = () => {
  form.value.validate().then(success => {
    if (success) {
      emits('onSubmit', policy)
    }
  })
}

</script>
<style lang='stylus' scoped>
</style>
