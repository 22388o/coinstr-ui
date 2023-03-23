import nostr from 'src/store/nostr'
import {
  computed
} from 'vue'
import { useStore } from 'vuex'

export const useNostr = () => {
  // Use composables
  const $store = useStore()
  const nostrApi = $store.$nostrApi

  const connectNostr = async ({ publicKey }) => {
    let response
    if (publicKey && isNpub(publicKey)) {
      response = nostrApi.NpubToHex({ publicKey }) || {}
    }
    const pubkey = response?.data || await nostrApi.Nip07.getPublicKey()

    const npubKey = nostrApi.HexToNpub({ publicKey: pubkey })
    return { pubkey, npubKey }
  }

  const disconnectNostr = async () => {
    $store.commit('nostr/clearNostrAccount')
    $store.commit('nostr/updateRelays', [])
  }
  const getProfileMetadata = async ({ pubkey }) => {
    const { content, tags } = await nostrApi.getProfileMetadata({ publicKey: pubkey })
    if (!content) {
      const [currentRelay] = nostrApi.getRelays() || []
      if (!currentRelay) throw new Error('Failed to get the profille from the relay ')
    }
    return { content, tags }
  }

  const setNostrAccount = ({ hex, npub, tags }) => {
    $store.commit('nostr/setNostrAccount', { hex, npub, tags })
  }
  const updateNostrAccount = (obj) => {
    const currentAccount = $store.getters['nostr/getActiveAccount']
    const rawCurrentAccount = JSON.parse(JSON.stringify(currentAccount))
    try {
      for (const [key, value] of Object.entries(obj)) {
        if (!Object.prototype.hasOwnProperty.call(rawCurrentAccount, key) || !rawCurrentAccount[key]) {
          rawCurrentAccount[key] = value
        }
      }
    } catch (error) {
      console.error(error)
    }
    $store.commit('nostr/updateNostrAccount', obj)
  }

  const getContacts = async ({ publicKey }) => {
    let relays = getRelays()
    relays = relays.map(relay => encodeURIComponent(relay))
    const promises = []
    relays.forEach(relay => {
      promises.push(requestContacts({ relay, publicKey }))
    })
    const contacts = await Promise.all(promises)
    const _contacts = contacts.map(contact => contact.contacts)
    return helperFilterContacts(_contacts)
  }
  const requestContacts = async ({ relay, publicKey }) => {
    const ndkRest = process.env.NDK_REST_URL
    try {
      const response = await fetch(`${ndkRest}/${relay}/${publicKey}/contacts`)
      const { data: contacts, message, success } = await response.json()

      if (success) {
        for (const [key, value] of Object.entries(contacts)) {
          if (key) {
            const npubEncode = nostrApi.HexToNpub({ publicKey: key })
            value.npub = npubEncode
            value.bitcoinAddress = key
          }
        }

        return { contacts }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  // Message Feature
  const sendMessage = async ({ relay, publicKey, toPublickKey, message }) => {
    const ciphertext = await nostrApi.encryptMessage({ publicKey, message: 'Hello from Coinstr 🪙' })
    console.log({ ciphertext })
    const event = {
      kind: 4,
      pubkey: publicKey,
      tags: [['p', toPublickKey]],
      content: ciphertext
    }
    console.log({ event })
  }

  const isNpub = (key) => {
    const npubIdentifier = 'npub'
    return key?.substring(0, npubIdentifier.length) === npubIdentifier
  }

  const HexToNpub = (hex) => {
    const npubIdentifier = 'npub'
    if (!hex) return
    if (hex?.substring(0, npubIdentifier.length) === npubIdentifier) return hex
    nostrApi.HexToNpub({ publicKey: hex })
  }

  const NpubToHex = (npub) => {
    const npubIdentifier = 'npub'
    if (!npub) return
    if (npub?.substring(0, npubIdentifier.length) === npubIdentifier) {
      nostrApi.NpubToHex({ publicKey: npub })
    }
  }

  const extensionIsAvailable = computed(() => { return !!window.nostr })

  const isLoggedIn = computed(() => $store.getters['nostr/isLoggedInNostr'])
  const getActiveAccount = computed(() => $store.getters['nostr/getActiveAccount'])

  const getRelays = () => $store.getters['nostr/getRelays']
  const setRelays = ({ relays }) => $store.commit('nostr/updateRelays', relays)

  const clearRelays = () => nostrApi.clearRelays()

  const connectPool = async ({ relays, hexPubKey }, subTrigger) => {
    return nostrApi.connectPool({ relays, hexPubKey }, subTrigger)
  }
  const helperFilterContacts = (contacts) => {
    const contactsProcessed = {}
    contacts.forEach(contact => {
      for (const key in contact) {
        contactsProcessed[key] = contact[key]
      }
    })
    return contactsProcessed
  }
  return {
    connectNostr,
    getProfileMetadata,
    setNostrAccount,
    updateNostrAccount,
    isLoggedIn,
    getActiveAccount,
    disconnectNostr,
    clearRelays,
    getContacts,
    extensionIsAvailable,
    HexToNpub,
    NpubToHex,
    connectPool,
    getRelays,
    setRelays,
    sendMessage
  }
}
