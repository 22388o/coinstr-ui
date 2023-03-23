<template lang="pug">
#PoliciesScreen
  .row
    .col-8
      coinstr-blockly(
        ref="blocklyRef"
        @onChangedPolicy="validatePolicy"
        :eligiblesKeys="eligiblesContacts"
        :myPublicKey="myPublicKey"
      )
      .row.q-mt-sm
        .box.col.q-px-sm
          .text-body2.text-bold Policy code:
          .text-body2.text-weight-light {{ policy }}
        .row.justify-end.q-gutter-x-sm(v-if="isLoggedInNostr")
            q-btn(
              label="Save policy"
              color="primary"
            )
            q-btn(
              label="Load policy"
              color="secondary"
            )
    .col.q-pl-md
      template(v-if="isLoggedInNostr")
        .text-body2.text-bold Contacts:
        users-list.list(v-model="contacts" :loading="contacts === undefined")
      template(v-else)
        .text-body2.text-center.q-mt-md Please log in with your NOSTR account to see your contacts and add them to Policy.
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import CoinstrBlockly from '~/components/coinstr/coinstr-blockly'
import UsersList from '~/components/coinstr/users-list.vue'
import { useNostr } from '~/composables'
import { useStore } from 'vuex'

const $store = useStore()
const {
  getContacts
} = useNostr()

const blocklyRef = ref(undefined)
const policy = ref(undefined)
const contacts = ref(undefined)

const isLoggedInNostr = computed(() => $store.getters['nostr/isLoggedInNostr'])
const myPublicKey = ref(undefined)

watch(isLoggedInNostr, function (v) {
  try {
    loadContacts()
  } catch (e) {
    console.error(e)
  }
})

onMounted(() => {
  try {
    loadContacts()
  } catch (e) {
    console.error(e)
  }
})

async function loadContacts () {
  const pubkey = $store.getters['nostr/getActiveAccount']
  if (isLoggedInNostr.value) {
    myPublicKey.value = pubkey.hex
    const data = await getContacts({ publicKey: pubkey.hex })
    contacts.value = data
  } else contacts.value = undefined
}

function generateCode () {
  const result = blocklyRef.value.generateCode()
  policy.value = result
}

function validatePolicy (code) {
  policy.value = code
}

const eligiblesContacts = computed(() => {
  if (!contacts.value) return []
  return Object.entries(contacts.value).map(v => v[1]).filter(user => user.isSelectable)
})

// --
</script>

<style lang="stylus" scoped>
.box
  inline-size: 150px
  overflow-wrap: break-word

.list
  height: 85vh
  overflow-y: scroll
</style>
