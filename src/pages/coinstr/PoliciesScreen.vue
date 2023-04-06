<template lang="pug">
#PoliciesScreen
  .row
    .col-8
      #template
        .text-body2.text-bold Policy creator:
        coinstr-blockly(
          ref="blocklyRef"
          @onChangedPolicy="validatePolicy"
          :eligiblesKeys="eligiblesContacts"
          :myPublicKey="myPublicKey"
        )
      .row.q-mt-sm
        .box.col.q-pr-sm
          .text-body2.text-bold Policy code:
          .text-body2.text-weight-light {{ policy }}
        .row.justify-end.q-gutter-x-sm(v-if="isLoggedInNostr")
          q-btn(
            label="Save policy"
            color="primary"
            @click="savePolicy"
          )
          q-btn(
            label="Load policy"
            color="secondary"
            @click="loadPolicy"
          )
    .col.q-pl-md
      template(v-if="isLoggedInNostr")
        .text-body2.text-bold Contacts:
        q-input.q-mb-sm(
          placeholder="Search"
          dense
          v-model="searchContacts"
          debounce="100"
          clearable
          clear-icon="close"
        )
        users-list.list(v-model="contacts" :loading="contacts === undefined" :search="searchContacts")
      template(v-else)
        .text-body2.text-center.q-mt-md Please log in with your NOSTR account to see your contacts and add them to Policy.
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import CoinstrBlockly from '~/components/blockly/coinstr-blockly'
import UsersList from '~/components/users/users-list.vue'
import { useNostr, useNotifications } from '~/composables'
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

const {
  handlerError,
  showLoading,
  hideLoading
} = useNotifications()

const blocklyRef = ref(undefined)
const policy = ref(undefined)
const contacts = ref(undefined)
const searchContacts = ref(undefined)

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

/**
 * @async
 * @name loadContacts
 * @description Loads contacts for the currently active account.
 * @returns {Promise<void>}
 */
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
      let plainText = null
      try {
        plainText = await decryptMessage({ message: content })
        msg.plainText = plainText
        // console.log({ msg })
        addOwnMessage({ message: msg })
      } catch (e) {
        console.error(e)
      }
    }
    messageSubscriptions = await subscriptionToMessages({ hexPublicKey }, newMessage)
  } catch (error) {
    console.error(error)
  }
}
async function loadContacts () {
  try {
    contacts.value = undefined
    const pubKey = $store.getters['nostr/getActiveAccount']
    if (isLoggedInNostr.value) {
      myPublicKey.value = pubKey.hex
      const data = await getContacts({ publicKey: pubKey.hex })
      contacts.value = data
    } else contacts.value = undefined
  } catch (e) {
    handlerError(e)
    console.error(e)
  }
}

function validatePolicy (code) {
  policy.value = code
}

function onSuccessPublish (response) {
  // console.log('onSuccessPublish', { response })
}

// Computed
const eligiblesContacts = computed(() => {
  if (!contacts.value) return []
  const _contacts = contacts.value.filter(user => user.isSelectable).map((user) => {
    const label = user.display_name || user.name
    const isSelectable = user.isSelectable
    const pk = user.bitcoinAddress
    return {
      ...user,
      label,
      pk,
      isSelectable
    }
  })
  return _contacts
})

// Save and load policies

/**
 * @name savePolicy
 * @description Saves the current workspace to local storage as a policy.
 * @returns {void}
 */
async function savePolicy () {
  try {
    showLoading()
    const textDom = blocklyRef.value.saveWorkspace()
    const keys = eligiblesContacts.value.map(user => user.pk)

    const message = { json: textDom, policyCode: policy.value, keys }
    const { npub } = getActiveAccount.value || {}
    const toPublickKey = npub

    if (!message || !toPublickKey) return
    localStorage.setItem('savedPolicy', JSON.stringify(message))
    // await sendMessage({ message, toPublickKey }, onSuccessPublish)
  } catch (e) {
    console.error(e)
    handlerError(e)
  } finally {
    hideLoading()
  }
}

/**
 * @name loadPolicy
 * @description Loads a previously saved policy from local storage.
 * @returns {void}
 */
function loadPolicy () {
  try {
    showLoading()
    const savedPolicy = localStorage.getItem('savedPolicy')
    const { json, keys } = JSON.parse(savedPolicy)

    keys.forEach(key => {
      const isALoadedUser = !!eligiblesContacts.value.find(v => v.bitcoinAddress === key)
      if (!isALoadedUser) {
        const contactOnList = contacts.value?.find(v => v.bitcoinAddress === key)
        if (contactOnList) {
          contactOnList.isSelectable = true
        } else {
          contacts.value = contacts.value?.concat([
            {
              bitcoinAddress: key,
              name: `${key.substring(0, 8)}...${key.substring(key.length - 8)}`,
              display_name: `${key.substring(0, 5)}...${key.substring(key.length - 5)}`,
              isSelectable: true
            }
          ])
        }
      }
    })
    setTimeout(() => {
      blocklyRef.value.loadWorkspace(json)
    }, 500)
  } catch (e) {
    console.error(e)
    handlerError(e)
  } finally {
    hideLoading()
  }
}
// --
</script>

<style lang="stylus" scoped>
.box
  inline-size: 150px
  overflow-wrap: break-word

.list
  height: 80vh
  overflow-y: scroll
</style>
