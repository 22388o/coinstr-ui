<template lang="pug">
q-card.full-width(flat bordered)
  q-card-section
    q-icon.cursor-pointer(@click="() => currentSelection = options[2]" name="arrow_back" size="sm" color="primary")

    q-form.q-pa-lg(ref="nostrForm" @submit="onSubmit")
      .text-h5.q-py-md(v-if="currentSelection === options[2]") Login methods

      q-btn.row.q-my-md.q-py-md.full-width(v-if="currentSelection === options[2] && extensionAvailable"
        color="primary"
        no-caps rounded
        @click="() => currentSelection = options[0]"
      ) Login with Extension
      q-btn.row.q-my-md.q-py-md.full-width(v-if="currentSelection === options[2]"
        color="secondary"
        no-caps
        rounded
        @click="() => currentSelection = options[1]"
      ) Login with Key

      #Extension(v-if="currentSelection === options[0]")
        .row.items-center(v-for="(relay, index) in form.relays")
          h-input.q-py-sm.col-11(
            v-model="relay.value"
            outlined
            :label="index===0 ? 'Relay to connect' : ''"
            :key="relay"
            dense
            placeholder="relay.snort.social"
            :rules="[rules.isValidRelay, rules.required]"
          )
          q-icon.row.q-my-lg.col-1.cursor-pointer(
            v-if="currentSelection === options[0] && index > 0"
            size="sm"
            name="delete"
            color="primary"
            @click="removeElement(index)"
          )
            q-tooltip(:delay="delay") Delete relay
        q-icon.row.justify-end.cursor-pointer(
          name="add_circle"
          color="primary"
          size="sm"
          @click="() => form.relays.push({value: undefined})"
        )
          q-tooltip(:delay="delay") Add relay

      #Key(v-if="currentSelection === options[1]")
        .row.items-center(v-for="(relay, index) in form.relays")
          h-input.q-py-sm.col-11(
            v-model="relay.value"
            outlined
            :label="index===0 ? 'Relay to connect' : ''"
            :key="relay"
            dense
            placeholder="relay.snort.social"
            :rules="[rules.isValidRelay, rules.required]"
          )
          q-icon.row.q-my-lg.col-1.cursor-pointer(
            v-if="currentSelection === options[1] && index > 0"
            size="sm"
            name="delete"
            color="primary"
            @click="removeElement(index)"
          )
            q-tooltip(:delay="delay") Delete relay
        q-icon.row.justify-end.cursor-pointer(
          name="add_circle"
          color="primary"
          size="sm"
          @click="() => form.relays.push({value: undefined})"
        )
          q-tooltip(:delay="delay") Add relay
        h-input.q-py-sm(
          v-model="form.address"
          outlined
          label="Public Key of the user"
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
import { defineProps, defineEmits, reactive, ref } from 'vue'
import { useValidations } from '~/composables'
// props
const { rules } = useValidations()
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
const delay = 800

const form = reactive({
  // relay: 'wss://relay.rip',
  relays: [
    {
      value: 'relay.rip'
    }
    // {
    //   value:
    //   'wss://relay.snort.social'
    // }
  ],
  address: 'npub1aff8upvht8fk3f2j2vnsg48936wkunlzaxxnqttwqxppl2tnykwsahwngp'
})

const onSubmit = () => {
  form.relays = form.relays?.map(relay => {
    return {
      value: relay.value?.startsWith('wss://') ? relay.value : `wss://${relay.value}`
    }
  })
  emits('onSubmit', {
    type: currentSelection.value,
    relays: form.relays.map((relay) => relay?.value),
    address: form.address
  })
}

const removeElement = (index) => form.relays.splice(index, 1)
</script>
<style lang="stylus" scoped></style>
