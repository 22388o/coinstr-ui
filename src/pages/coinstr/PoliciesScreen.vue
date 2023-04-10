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
            @click="showPolicyForm = true"
          )
          q-btn(
            label="Load policy"
            color="secondary"
            @click="onLoadPolicy"
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
  q-dialog(v-model="showPolicyForm")
    policy-form(
      @onSubmit="onSavePolicy"
    )
  q-dialog(v-model="showPolicies")
    policy-list(
      :policies="policiesArray.data"
      @onSubmit="loadPolicy"
    )
</template>

<script setup>
import { ref, onMounted, computed, watch, reactive } from 'vue'
// eslint-disable-next-line import/no-duplicates
import init from 'tlalocman-bdk-wasm'
import CoinstrBlockly from '~/components/blockly/coinstr-blockly'

import UsersList from '~/components/users/users-list.vue'
import { useNostr, useNotifications } from '~/composables'
import { useStore } from 'vuex'
import PolicyForm from '~/components/policy/policy-form.vue'
import policyList from '~/components/policy/policy-list.vue'

const $store = useStore()
const {
  getContacts,
  sendMessage,
  getMessages,
  getActiveAccount,
  decryptMessage,
  addOwnMessage,
  getPoliciesByAccount,
  savePolicy,
  subscriptionToMessages
} = useNostr()

const {
  handlerError,
  showLoading,
  hideLoading,
  showNotification
} = useNotifications()

const blocklyRef = ref(undefined)
const policy = ref(undefined)
const contacts = ref(undefined)
const searchContacts = ref(undefined)

const showPolicyForm = ref(false)
const showPolicies = ref(false)

const policiesArray = reactive({
  data: []
})

const isLoggedInNostr = computed(() => $store.getters['nostr/isLoggedInNostr'])
const myPublicKey = ref(undefined)
let messageSubscriptions

watch(isLoggedInNostr, async function (v) {
  try {
    loadContacts()
    // await getMessagesFromAccount({ hexPublicKey: getActiveAccount.value.hex })
  } catch (e) {
    console.error(e)
  }
})

onMounted(async () => {
  try {
    await init()
    // console.log({ from: fromMiniscriptPolicy('thresh(2,pk(5e61551ceb04521181d9ad40295e32dce5dc5609c4612a3239dbc60c30080dcd),pk(d223b67e6091ef0665188a4016d20a51a7bbb1b240fafc4429bf139527338d1))') })
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

// Example of how message works
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
// Example of how message works
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
async function onSavePolicy ({ name, description }) {
  try {
    showPolicyForm.value = false
    showLoading()
    const textDom = blocklyRef.value.saveWorkspace()
    const keys = eligiblesContacts.value.map(user => user.pk)

    // const message = { json: textDom, policyCode: policy.value, keys }
    const _policy = {
      name,
      description,
      miniscript: policy.value,
      uiMetadata: {
        json: textDom,
        policyCode: policy.value,
        keys
      }
    }
    // Save to local storage
    // localStorage.setItem('savedPolicy', JSON.stringify(_policy))

    // Send message to nostr
    // await sendMessage({ message, toPublickKey }, onSuccessPublish)

    // Save Policy using Nostr Event
    try {
      await savePolicy(_policy)
      showNotification({ message: 'Policy saved successfully', color: 'positive' })
    } catch (error) {
      console.error(error)
      handlerError(error)
    }
  } catch (e) {
    console.error(e)
    handlerError(e)
  } finally {
    hideLoading()
  }
}
async function onLoadPolicy () {
  let openModal
  let response
  if (policiesArray.data && policiesArray.data.length > 0) {
    showPolicies.value = true
    return
  }
  try {
    showLoading()
    response = await getPoliciesByAccount()
    openModal = response?.length > 0
  } catch (error) {
    handlerError(error)
    openModal = false
    response = []
  } finally {
    hideLoading()
  }

  if (openModal) {
    showNotification({ message: 'Policies loaded successfully', color: 'positive' })
    const _policies = response?.map(policy => policy?.plainText)
    policiesArray.data = [..._policies]
    showPolicies.value = true
  } else { handlerError('No policies found') }
}

/**
 * @name loadPolicy
 * @description Loads a previously saved policy from local storage.
 * @returns {void}
 */
async function loadPolicy (policy) {
  try {
    showLoading()
    const { uiMetadata } = policy || {}
    const { json, keys } = uiMetadata || {}

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
