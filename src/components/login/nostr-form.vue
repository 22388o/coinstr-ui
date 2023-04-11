<template lang="pug">
q-card.full-width.bg-secondary(flat bordered)
  q-card-section
    .row.justify-start
      q-icon.cursor-pointer(v-show="currentSelection !== options[2]" @click="() => currentSelection = options[2]" name="arrow_back" size="sm" color="primary")
    q-form.q-pa-lg(ref="nostrForm" @submit="onSubmit")
      .text-h5.q-py-md.q-pb-lg.text-grey-dark.text-center(v-if="currentSelection === options[2]") Login methods

      q-btn.row.q-my-md.q-py-md.full-width.btn--rounded(v-if="currentSelection === options[2] && extensionAvailable"
        color="primary"
        no-caps
        dark
        @click="() => currentSelection = options[0]"
      ) Login with Extension

      q-separator(v-if="currentSelection === options[2]").q-my-lg.bg-grey-dark

      q-btn.row.q-my-md.q-py-md.full-width.btn--rounded(v-if="currentSelection === options[2]"
        color="primary"
        no-caps
        outline
        dark
        @click="() => currentSelection = options[1]"
      ) Login with Key

      #Extension(v-if="currentSelection === options[0]")
        .row.q-gutter-md.items-center
            .text-subtitle1.text-white Relays to connect
            q-icon.row.justify-end.cursor-pointer(
              color="primary"
              size="md"
              @click="() => form.relays.push({value: undefined})"
            )
              svg(width="40", height="40", xmlns="http://www.w3.org/2000/svg", viewBox="0 96 960 960")
                  path(d="M463.077 756h33.846V592.923H660v-33.846H496.923V396h-33.846v163.077H300v33.846h163.077V756ZM218.461 896q-24.577 0-41.519-16.942Q160 862.116 160 837.539V314.461q0-24.577 16.942-41.519Q193.884 256 218.461 256h523.078q24.577 0 41.519 16.942Q800 289.884 800 314.461v523.078q0 24.577-16.942 41.519Q766.116 896 741.539 896H218.461Zm0-33.846h523.078q9.231 0 16.923-7.692 7.692-7.692 7.692-16.923V314.461q0-9.231-7.692-16.923-7.692-7.692-16.923-7.692H218.461q-9.231 0-16.923 7.692-7.692 7.692-7.692 16.923v523.078q0 9.231 7.692 16.923 7.692 7.692 16.923 7.692Zm-24.615-572.308v572.308-572.308Z")
              q-tooltip(:delay="delay") Add relay
        .row.items-center(v-for="(relay, index) in form.relays")
          h-input.q-py-sm.col-11(
            v-model="relay.value"
            outlined
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
      #Key(v-if="currentSelection === options[1]")
        .row.q-gutter-md.items-center
          .text-subtitle1.text-white Relays to connect
          q-icon.row.justify-end.cursor-pointer(
            color="primary"
            size="md"
            @click="() => form.relays.push({value: undefined})"
          )
            svg(width="40", height="40", xmlns="http://www.w3.org/2000/svg", viewBox="0 96 960 960")
                path(d="M463.077 756h33.846V592.923H660v-33.846H496.923V396h-33.846v163.077H300v33.846h163.077V756ZM218.461 896q-24.577 0-41.519-16.942Q160 862.116 160 837.539V314.461q0-24.577 16.942-41.519Q193.884 256 218.461 256h523.078q24.577 0 41.519 16.942Q800 289.884 800 314.461v523.078q0 24.577-16.942 41.519Q766.116 896 741.539 896H218.461Zm0-33.846h523.078q9.231 0 16.923-7.692 7.692-7.692 7.692-16.923V314.461q0-9.231-7.692-16.923-7.692-7.692-16.923-7.692H218.461q-9.231 0-16.923 7.692-7.692 7.692-7.692 16.923v523.078q0 9.231 7.692 16.923 7.692 7.692 16.923 7.692Zm-24.615-572.308v572.308-572.308Z")
            q-tooltip(:delay="delay") Add relay
        .row.items-center(v-for="(relay, index) in form.relays")
          h-input.q-py-sm.col-11(
            v-model="relay.value"
            outlined
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
        .text-subtitle1.text-white.q-pt-md Public Key of the user
        h-input.q-py-sm(
          v-model="form.address"
          outlined
        )
      q-separator(v-if="currentSelection !== options[2]").q-my-lg.bg-grey-dark
      .row.justify-center
        q-btn.q-mb-xs.full-width(
          v-if="currentSelection != options[2]"
          :class="{'q-ml-xs': currentSelection === options[1]}"
          type="submit"
          icon-right="done"
          size="md"
          color="primary"
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

const onSubmit = async () => {
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
