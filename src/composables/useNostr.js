import {
  computed
} from 'vue'
import { useStore } from 'vuex'

export const useNostr = () => {
  // Use composables
  const $store = useStore()
  const nostrApi = $store.$nostrApi

  /**
   * @async
   * @name connectNostr
   * @description Connects to a Nostr account with the given public key.
   * @param {Object} options - The options for connecting to the account.
   * @param {string} options.publicKey - The public key for the account.
   * @returns {Promise<Object>} - An object containing the public key and npub key for the account.
   */
  const connectNostr = async ({ publicKey }) => {
    let response
    if (publicKey && isNpub(publicKey)) {
      response = nostrApi.NpubToHex({ publicKey }) || {}
    }
    const pubkey = response?.data || await nostrApi.Nip07.getPublicKey()

    const npubKey = nostrApi.HexToNpub({ publicKey: pubkey })
    return { pubkey, npubKey }
  }

  /**
   * @async
   * @name disconnectNostr
   * @description Disconnects from the active Nostr account.
   */
  const disconnectNostr = async () => {
    $store.commit('nostr/clearNostrAccount')
    $store.commit('nostr/updateRelays', [])
  }

  /**
   * @async
   * @name getProfileMetadata
   * @description Gets the profile metadata for a Nostr account with the given public key.
   * @param {Object} options - The options for getting the profile metadata.
   * @param {string} options.publicKey - The public key for the account.
   * @returns {Promise<Object>} - An object containing the content and tags for the profile.
   */
  const getProfileMetadata = async ({ pubkey }) => {
    const { content, tags } = await nostrApi.getProfileMetadata({ publicKey: pubkey })
    if (!content) {
      const [currentRelay] = nostrApi.getRelays() || []
      if (!currentRelay) throw new Error('Failed to get the profille from the relay ')
    }
    return { content, tags }
  }

  /**
   * @name setNostrAccount
   * @description Sets the active Nostr account with the given hex, npub, and tags.
   * @param {Object} options - The options for setting the active account.
   * @param {string} options.hex - The hex representation of the account.
   * @param {string} options.npub - The npub key for the account.
   * @param {Array} options.tags - The tags for the account.
   */
  const setNostrAccount = ({ hex, npub, tags }) => {
    $store.commit('nostr/setNostrAccount', { hex, npub, tags })
  }

  /**
   * @name updateNostrAccount
   * @description Updates the active Nostr account with the given object.
   * @param {Object} obj - The object containing the updates to the account.
   */
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

  /**
   * @async
   * @name getContacts
   * @description Gets the contacts for a Nostr account with the given public key.
   * @param {Object} options - The options for getting the contacts.
   * @param {string} options.publicKey - The public key for the account.
   * @returns {Promise<Array>} - An array of contact objects.
   */
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
  const isNpub = (key) => {
    const npubIdentifier = 'npub'
    return key?.substring(0, npubIdentifier.length) === npubIdentifier
  }

  /**
   * @name HexToNpub
   * @description Converts a hex string to an npub key.
   * @param {string} hex - The hex string to convert.
   * @returns {string} - The npub key.
   */
  const HexToNpub = (hex) => {
    const npubIdentifier = 'npub'
    if (!hex) return
    if (hex?.substring(0, npubIdentifier.length) === npubIdentifier) return hex
    nostrApi.HexToNpub({ publicKey: hex })
  }

  /**
   * @name NpubToHex
   * @description Converts an npub key to a hex string.
   * @param {string} npub - The npub key to convert.
   * @returns {string} - The hex string.
   */
  const NpubToHex = (npub) => {
    const npubIdentifier = 'npub'
    if (!npub) return
    if (npub?.substring(0, npubIdentifier.length) === npubIdentifier) {
      nostrApi.NpubToHex({ publicKey: npub })
    }
  }

  /**
   * @computed extensionIsAvailable
   * @description A computed property that returns true if the Nostr extension is available, otherwise false.
   * @type {boolean}
   */
  const extensionIsAvailable = computed(() => { return !!window.nostr })

  /**
   * @computed isLoggedIn
   * @description A computed property that returns true if the user is logged in to Nostr, otherwise false.
   * @type {boolean}
   */
  const isLoggedIn = computed(() => $store.getters['nostr/isLoggedInNostr'])

  /**
   * @computed getActiveAccount
   * @description A computed property that returns the active Nostr account.
   * @type {Object}
   */
  const getActiveAccount = computed(() => $store.getters['nostr/getActiveAccount'])

  /**
   * @name getRelays
   * @description Gets the relays for the active Nostr account.
   * @returns {Array} - An array of relay strings.
   */
  const getRelays = () => $store.getters['nostr/getRelays']

  /**
   * @name setRelays
   * @description Sets the relays for the active Nostr account.
   * @param {Object} options - The options for setting the relays.
   * @param {Array} options.relays - The relay strings to set.
   */
  const setRelays = ({ relays }) => $store.commit('nostr/updateRelays', relays)

  /**
   * @name clearRelays
   * @description Clears the relays for the active Nostr account.
   */
  const clearRelays = () => nostrApi.clearRelays()

  /**
   * @async
   * @name connectPool
   * @description Connects to a Nostr pool with the given relays and public key.
   */
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
    if (!contactsProcessed || contactsProcessed === {}) return []
    return Object.entries(contactsProcessed).map(v => v[1])
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
    setRelays
  }
}
