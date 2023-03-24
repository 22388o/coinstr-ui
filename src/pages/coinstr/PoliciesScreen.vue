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
import CoinstrBlockly from '~/components/coinstr/coinstr-blockly'
import UsersList from '~/components/coinstr/users-list.vue'
import { useNostr, useNotifications } from '~/composables'
import { useStore } from 'vuex'

const $store = useStore()
const {
  getContacts
} = useNostr()

const {
  handlerError,
  showLoading,
  hideLoading
} = useNotifications()

const blocklyRef = ref(undefined)
const policy = ref(undefined)
const contacts = ref(undefined)

const isLoggedInNostr = computed(() => $store.getters['nostr/isLoggedInNostr'])
const myPublicKey = ref(undefined)

// Search contacts
const searchContacts = ref(undefined)

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
    handlerError(e)
  }
})

/**
 * @async
 * @name loadContacts
 * @description Loads contacts for the currently active account.
 * @returns {Promise<void>}
 */
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
function savePolicy () {
  try {
    showLoading()
    const textDom = blocklyRef.value.saveWorkspace()
    const serializer = new XMLSerializer()
    const xmlString = serializer.serializeToString(textDom)
    const policy = {
      users: eligiblesContacts.value,
      xmlString
    }
    localStorage.setItem('savedPolicy', JSON.stringify(policy))
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
    const { xmlString, users } = JSON.parse(savedPolicy)
    users.forEach(policyUser => {
      const isALoadedUser = !!eligiblesContacts.value.find(v => v.bitcoinAddress === policyUser.bitcoinAddress)
      if (!isALoadedUser) {
        const contactOnList = contacts.value.find(v => v.bitcoinAddress === policyUser.bitcoinAddress)
        if (contactOnList) {
          contactOnList.isSelectable = true
        } else contacts.value = contacts.value.concat(policyUser)
      }
    })
    setTimeout(() => {
      blocklyRef.value.loadWorkspace(xmlString)
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
