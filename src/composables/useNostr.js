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

  // Message Feature

  /** Sends an encrypted message to a recipient specified by their public key
    @async
    @function sendMessage
    @param {Object} messageData - The message data object
    @param {string} messageData.toPublicKey - The recipient's public key in string format (NPUB)
    @param {string} messageData.message - The message to be encrypted and sent
    @param {string} subTrigger - The sub-trigger parameter for the sendMessage API
    @returns {Promise<string>} - A promise that resolves to the publication identifier(s) of the sent message(s)
    @throws {Error} - If the active account is not set
*/
  const sendMessage = async ({ toPublickKey, message }, subTrigger) => {
    const { hex, npub } = getActiveAccount.value

    const { data: toHexKey } = NpubToHex(toPublickKey)

    const _message = createMessage({ app: 'coinstr', type: 'policy', data: message })
    const ciphertext = await nostrApi.encryptMessage({ publicKey: toHexKey, message: _message })

    const pubs = await nostrApi.sendMessage({
      from: { hex, npub },
      to: toHexKey,
      ciphertext
    }, subTrigger)

    return pubs
  }

  /**
   * Get messages from Nostr Relay
   * @param {Object} params
   * @param {string} params.hexPublicKey - Hex public key.
   * @param {Object} subTrigger - Sub trigger.
   * @returns {Promise<Object>} Promise with messages.
   */
  const getMessages = async ({ hexPublicKey }, subTrigger) => {
    return nostrApi.getMessages({ hexPublicKey }, subTrigger)
  }
  const subscriptionToMessages = async ({ hexPublicKey }, subTrigger) => {
    return nostrApi.subscriptionToMessages({ hexPublicKey }, subTrigger)
  }

  /**
   * Create a metadata string [Message to send] from the given data.
   *
   * @param {object} options - The options object.
   * @param {string} options.app - The name of the app. [Coinstr]
   * @param {string} options.type - The type of the message. [Policy]
   * @param {object} options.data - The data to include in the message.
   *
   * @returns {string} The metadata string.
   */
  const createMessage = ({ app, type, data }) => {
    const metadata = {
      app,
      type,
      message: JSON.stringify(data)
    }

    let metadataString = ''
    for (const [key, value] of Object.entries(metadata)) {
      metadataString += `#${encodeURIComponent(key)}:${encodeURIComponent(value)}`
    }

    return metadataString
  }
  /**
   * Decrypts a message using the active account's public key and returns the metadata as an object.
   * If decryption fails, returns the plaintext message instead.
   *
   * @async
   * @function
   *
   * @param {object} options - The options object.
   * @param {string} options.message - The message to decrypt.
   *
   * @returns {Promise<object|string>} A promise that resolves to an object containing the message's metadata key-value pairs, or to the plaintext message if decryption failed.
   */
  const decryptMessage = async ({ message }) => {
    const publicKey = getActiveAccount.value.hex
    const plainText = await nostrApi.decryptMessage({ publicKey, message })
    return getMetadataFromString(plainText) || plainText
  }
  /**
   * Parses a metadata string and returns an object with key-value pairs.
   *
   * @param {string} metadataString - The metadata string to parse.
   *
   * @returns {object|undefined} An object containing the metadata key-value pairs, or undefined if parsing failed.
   */
  const getMetadataFromString = (metadataString) => {
    if (!metadataString && metadataString === '') return undefined

    const metadata = {}

    const parts = metadataString?.split('#')
    const _parts = parts?.filter(part => part !== '')

    if (!_parts || _parts.length === 0) return undefined

    _parts.forEach(part => {
      const [key, value] = part?.split(':')
      try {
        metadata[decodeURIComponent(key)] = decodeURIComponent(value)
      } catch (e) {
        return undefined
      }
    })

    try {
      metadata.message = JSON.parse(metadata.message)
    } catch (e) {
      return undefined
    }

    return metadata
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
    return nostrApi.HexToNpub({ publicKey: hex })
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
      return nostrApi.NpubToHex({ publicKey: npub })
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

  const addOwnMessage = ({ message }) => $store.commit('nostr/addOwnMessage', message)

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
    setRelays,
    sendMessage,
    getMessages,
    subscriptionToMessages,
    decryptMessage,
    addOwnMessage
  }
}
