<template lang='pug'>
q-card.full-width
  q-card-section
    q-form(ref="form")
      pre {{ policy }}
      q-input.q-py-md.q-px-lg(
        outlined
        v-model="policy.name"
        label="Policy name"
        placeholder="Policy name"
        :rules="[rules.required]"
      )
      q-input.q-py-md.q-px-lg(
        outlined
        v-model="policy.description"
        label="Policy description"
        placeholder="Policy description"
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
