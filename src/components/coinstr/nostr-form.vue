<template lang='pug'>
q-card.full-width(flat bordered)
  q-card-section
    q-icon.cursor-pointer(@click="() => currentSelection = options[2]" name="arrow_back" size="sm" color="primary")
    q-form.q-pa-lg(ref="nostrForm" @submit="onSubmit")
      .text-h5.q-py-md(v-if="currentSelection === options[2]") Login methods
      q-btn.row.q-my-md.q-py-md.full-width(v-if="currentSelection === options[2] && extensionAvailable" color="primary" no-caps rounded @click="() => currentSelection = options[0]") Login with Extension
      q-btn.row.q-my-md.q-py-md.full-width(v-if="currentSelection === options[2]" color="secondary" no-caps rounded @click="() => currentSelection = options[1]") Login with Key
      #Extension(v-if="currentSelection === options[0]")
        h-input.q-py-sm(
          v-for="(relay, index) in form.relays"
          v-model="relay.value"
          outlined
          :label="index===0 ? 'Relay to connect' : ''"
          :key="relay"
          dense
        )
        q-icon.row.justify-end(name="add_circle" @click="() => form.relays.push({value: undefined})")
      #Key(v-if="currentSelection === options[1]")
        h-input.q-py-sm(
          v-for="(relay, index) in form.relays"
          v-model="relay.value"
          outlined
          :label="index===0 ? 'Relay to connect' : ''"
          :key="relay"
          dense
        )
        q-icon.row.justify-end(name="add_circle" @click="() => form.relays.push({value: undefined})")
        h-input.q-py-sm(
          v-model="form.address"
          outlined
          label="Publick Key of the user"
        )
      .row.justify-end
        q-btn(
          v-if="currentSelection != options[2]"
          type="submit"
          label="Ok"
          color="positive"
          no-caps
        )
</template>
<script setup>
import {
  defineProps,
  defineEmits,
  reactive,
  ref
} from 'vue'
// props

const props = defineProps({
  extensionAvailable: {
    type: Boolean,
    default: false
  }
})
// Emits
const emits = defineEmits(['onSubmit'])
// Methods by Feature

const options = ['extension', 'key', 'notSelected']
const currentSelection = ref(options[2])

const form = reactive({
  // relay: 'wss://relay.rip',
  relays: [
    {
      value:
      'wss://relay.rip'
    }, {
      value:
      'wss://relay.snort.social'
    }
  ],
  address: 'npub1aff8upvht8fk3f2j2vnsg48936wkunlzaxxnqttwqxppl2tnykwsahwngp'
})

const onSubmit = () => {
  emits('onSubmit', {
    type: currentSelection.value,
    relays: form.relays.map(relay => relay?.value),
    address: form.address
  })
}
</script>
<style lang='stylus' scoped>
</style>
