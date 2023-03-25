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
              @click="onSavePolicy"
            )
            q-btn(
              label="Load policy"
              color="secondary"
            )
      .row.q-pt-md
        .row {{ currentOwnMessages.length }} messages
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
  getContacts,
  sendMessage,
  getMessages,
  getActiveAccount,
  decryptMessage,
  addOwnMessage,
  subscriptionToMessages
} = useNostr()

const blocklyRef = ref(undefined)
const policy = ref(undefined)
const contacts = ref(undefined)

const isLoggedInNostr = computed(() => $store.getters['nostr/isLoggedInNostr'])
const myPublicKey = ref(undefined)
let messageSubscriptions

watch(isLoggedInNostr, async function (v) {
  try {
    loadContacts()
    await getMessagesFromAccount({ hexPublicKey: getActiveAccount.value.hex })
  } catch (e) {
    console.error(e)
  }
})

onMounted(async () => {
  try {
    loadContacts()
  } catch (e) {
    console.error(e)
  }
})

const currentOwnMessages = computed(() => $store.getters['nostr/getOwnMessages'])
const newMessages = []

async function newMessage (message) {
  const toAccount = message?.tags?.[0]?.[1]

  if (toAccount !== getActiveAccount.value.hex) return

  const found = currentOwnMessages.value.find(msg => {
    return msg?.id === message?.id
  })

  if (found) return
  if (!message?.content) return

  const plainText = await decryptMessage({ message: message.content })
  message.plainText = plainText

  addOwnMessage({ message })
}
async function getMessagesFromAccount ({ hexPublicKey }) {
  try {
    const { messages } = await getMessages({ hexPublicKey }, newMessage)

    if (!messages || !messages?.length === 0) return

    // Messages filtered by current Account
    const messagesFiltered = messages.filter(msg => msg?.tags[0][1] === getActiveAccount.value.hex)

    for (const msg of messagesFiltered) {
      const { content } = msg || {}
      const plainText = await decryptMessage({ message: content })
      msg.plainText = plainText
      addOwnMessage({ message: msg })
    }
    messageSubscriptions = await subscriptionToMessages({ hexPublicKey }, newMessage)
  } catch (error) {
    console.error(error)
  }
}
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
async function onSavePolicy () {
  const message = { xml: 'xml_code', policyCode: policy.value, keys: [getActiveAccount.value.npub] }

  const { npub } = getActiveAccount.value || {}
  const toPublickKey = npub

  if (!message || !toPublickKey) return

  const pubs = await sendMessage({ message, toPublickKey }, onSuccessPublish)
}
function onSuccessPublish (response) {
  console.log({ response })
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
