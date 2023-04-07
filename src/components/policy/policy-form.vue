<template lang='pug'>
q-card.full-width
  q-card-section
    .text-h5.q-pl-lg.q-py-lg Policy Form
    q-form(ref="form")
      q-input.q-py-md.q-px-lg(
        outlined
        v-model="policy.name"
        label="Policy name"
        :rules="[rules.required]"
      )
      q-input.q-py-md.q-px-lg(
        outlined
        v-model="policy.description"
        label="Policy description"
        :rules="[rules.required]"
      )
      q-btn.q-my-md.q-mx-lg(
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
