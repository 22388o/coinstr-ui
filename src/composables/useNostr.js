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

  const getMessages = async ({ hexPublicKey }, subTrigger) => {
    return nostrApi.getMessages({ hexPublicKey }, subTrigger)
  }
  const subscriptionToMessages = async ({ hexPublicKey }, subTrigger) => {
    return nostrApi.subscriptionToMessages({ hexPublicKey }, subTrigger)
  }
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

  const HexToNpub = (hex) => {
    const npubIdentifier = 'npub'
    if (!hex) return
    if (hex?.substring(0, npubIdentifier.length) === npubIdentifier) return hex
    return nostrApi.HexToNpub({ publicKey: hex })
  }

  const NpubToHex = (npub) => {
    const npubIdentifier = 'npub'
    if (!npub) return
    if (npub?.substring(0, npubIdentifier.length) === npubIdentifier) {
      return nostrApi.NpubToHex({ publicKey: npub })
    }
  }

  const decryptMessage = async ({ message }) => {
    const publicKey = getActiveAccount.value.hex
    const plainText = await nostrApi.decryptMessage({ publicKey, message })
    return getMetadataFromString(plainText) || plainText
  }
  const extensionIsAvailable = computed(() => { return !!window.nostr })

  const isLoggedIn = computed(() => $store.getters['nostr/isLoggedInNostr'])
  const getActiveAccount = computed(() => $store.getters['nostr/getActiveAccount'])

  const getRelays = () => $store.getters['nostr/getRelays']
  const setRelays = ({ relays }) => $store.commit('nostr/updateRelays', relays)

  const clearRelays = () => nostrApi.clearRelays()

  const addOwnMessage = ({ message }) => $store.commit('nostr/addOwnMessage', message)
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
    sendMessage,
    getMessages,
    subscriptionToMessages,
    decryptMessage,
    addOwnMessage
  }
}
