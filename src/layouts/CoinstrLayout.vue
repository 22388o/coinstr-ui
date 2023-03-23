<template lang="pug">
q-layout.containerLayout(container view="hHh lpR fFf")
    q-header
      q-toolbar
        .row#brand.items-center
          q-img.q-ml-md.q-my-xs(
            src="/images/coinstr-logo.png"
            style="height: 50px; width: 50px"
          )
          .col.q-ml-sm
            .text.text-bold Coinstr
            .text Bitcoin multi-custody signature orchestation
        q-toolbar-title
          //- q-item
          //-   q-item-section
          //-     q-item-label Policies
        q-btn(
          v-if="!isLoggedIn"
          color="secondary"
          @click="() => dialog = true"
          no-caps
        )
          .text-white Connect to Nostr
        div.q-pa-xs(v-else)
            //- .row.items-center.q-gutter-md
            UserItem.cursor-pointer.text-white.no-padding(
              :user="getUserInfo"
            )
            .text-white.text-weight-bold connected to: {{ getCurrentRelay() }}
            q-menu(fit)
              q-list
                q-item(clickable v-close-popup @click="onLogout")
                  q-item-section Logout
      //- q-toolbar
    q-page-container
      .row.justify-center
        .col-12
          q-page.q-py-md.q-px-lg
            router-view
    q-dialog(v-model="dialog")
      NostrForm(
        :extensionAvailable="extensionIsAvailable"
        @onSubmit="onLoginNostr"
      )
</template>
<script setup>
import {
  ref,
  computed
} from 'vue'
import { useStore } from 'vuex'
import { useNostr, useNotifications } from '~/composables'
import { useQuasar } from 'quasar'
import UserItem from '~/components/coinstr/user-item.vue'
import NostrForm from '~/components/coinstr/nostr-form.vue'

const $q = useQuasar()

const $store = useStore()

const { showNotification, showLoading, hideLoading, handlerError } = useNotifications()

const {
  connectNostr, disconnectNostr,
  getProfileMetadata, setNostrAccount, updateNostrAccount,
  isLoggedIn, getActiveAccount,
  currentRelay, setRelay, clearRelays,
  extensionIsAvailable,
  getRelays, setRelays,
  connectPool
} = useNostr()

const relayInput = ref(undefined)

const dialog = ref(false)
let unsubscribe

const onLoginNostr = async ({ type, relays, address }) => {
  try {
    showLoading()

    setRelays({ relays })
    const { pubkey, npubKey } = await connectNostr({ publicKey: type === 'key' ? address : undefined })

    const { unsub } = await connectPool({ relays, hexPubKey: pubkey }, updateData)
    unsubscribe = unsub

    setNostrAccount({ hex: pubkey, npub: npubKey })

    showNotification({ message: `Connected to ${getCurrentRelay()}`, color: 'green' })
  } catch (error) {
    handlerError(error)
  } finally {
    hideLoading()
    dialog.value = false
  }
}
const updateData = (event) => {
  const {
    content,
    kind
  } = event || {}
  const obj = JSON.parse(content)
  updateNostrAccount(obj)
}
const getUserInfo = computed(() => {
  return {
    displayName: getActiveAccount.value?.profile?.display_name,
    name: getActiveAccount.value?.profile?.name,
    picture: getActiveAccount.value?.profile?.picture,
    npub: getActiveAccount.value?.npub,
    about: getActiveAccount.value?.profile?.about,
    nip05: getActiveAccount.value?.profile?.nip05,
    banner: getActiveAccount.value?.profile?.banner,
    lud06: getActiveAccount.value?.profile?.lud06,
    lud16: getActiveAccount.value?.profile?.lud16
  }
})
const onLogout = () => {
  unsubscribe()
  disconnectNostr()
}
const getCurrentRelay = () => {
  // const { url } = currentRelay() || {}
  return 'wss://lorem.ipsum'
}
// -
</script>

<style lang="stylus" scoped>
.containerLayout
  height: 100vh
</style>
