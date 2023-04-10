import {
  relayInit,
  generatePrivateKey,
  getPublicKey,
  getEventHash,
  signEvent,
  nip04,
  nip05,
  nip19,
  validateEvent,
  verifySignature,
  SimplePool
} from 'nostr-tools'

import Nip07 from './Nip07'
import { EventKind } from '~/const'
// eslint-disable-next-line import/no-duplicates
import { from_miniscript_policy as fromMiniscriptPolicy } from 'tlalocman-bdk-wasm/tlalocman_bdk_wasm'

class NostrApi {
  constructor (relays) {
    this.relays = relays || []
    this.Nip07 = Nip07
    this.relay = undefined
    this.pool = undefined
  }

  addRelay (relay) {
    this.relays.push(relay)
  }

  clearRelays () {
    this.relays = []
  }

  async connectPool ({ relays, hexPubKey }, subTrigger) {
    if (!relays) throw new Error('Provide relays to connect')
    const pool = new SimplePool()

    const sub = pool.sub(
      [...relays],
      [
        {
          authors: [hexPubKey],
          kinds: [EventKind.METADATA]
        }
      ]
    )
    this.relays = [...relays]
    this.pool = pool
    sub.on('event', event => {
      subTrigger(event)
    })
    return sub
  }

  async disconnect () {
    this.relay.close()
  }

  async queryProfile () {
    return nip05.queryProfile(('_@coinstr.app'))
  }

  async getProfileMetadata ({ publicKey }) {
    const sub = this.relay.sub([
      {
        kinds: [EventKind.METADATA],
        authors: [publicKey]
      }
    ])
    return new Promise((resolve, reject) => {
      sub.on('event', event => {
        resolve(event)
      })
      sub.on('eose', () => {
        reject('Failed to get the metadata')
      })
    })
  }

  async encryptMessage ({ publicKey, message }) {
    return Nip07.encrypt(publicKey, message)
  }

  async BuildEvent ({ kind, content, tags, pubkey, toSign = { nip: '07', privateKey: undefined } }) {
    const event = {
      pubkey,
      kind,
      content,
      tags,
      created_at: Math.floor(Date.now() / 1000)
    }
    if (!toSign) {
      event.id = getEventHash(event)
      return { event }
    }

    if (toSign?.nip === '04' && toSign?.privateKey) {
      event.id = getEventHash(event)
      const sig = await signEvent(event, toSign.privateKey)
      event.sig = sig
    }

    if (toSign?.nip === '07' && !toSign?.privateKey) {
      event.id = getEventHash(event)
      const { sig } = await Nip07.signEvent(event)
      event.sig = sig
    }

    return { event }
  }

  async sendMessage ({ from, to, ciphertext }, subTrigger) {
    try {
      const { hex } = from || {}

      const { event } = await this.BuildEvent({
        kind: EventKind.DM,
        content: ciphertext,
        tags: [['p', to]],
        pubkey: hex,
        toSign: {
          nip: '07',
          privateKey: undefined
        }
      })
      const pubs = this.pool.publish(this.relays, event)
      pubs.on('ok', (response) => {
        // this may be called multiple times, once for every relay that accepts the event
        // console.log('ok', response)
        subTrigger(response)
      })
      pubs.on('failed', reason => {
        // console.log(`failed to publish: ${reason}`)
      })
      return pubs
    } catch (error) {
      throw new Error(error)
    }
  }

  async getMessages ({ hexPublicKey }, subTrigger) {
    try {
      const event = {
        kinds: [EventKind.DM],
        authors: [hexPublicKey]
      }

      const messages = await this.pool.list(this.relays, [event])

      return { messages }
    } catch (error) {
      throw new Error(error)
    }
  }

  // TODO: Add the logic when the user enter their private key
  async savePolicy ({ name, description, miniscript, uiMetadata, pubKey }) {
    try {
      // TODO: extract the public keys from the miniscript policy
      const extractedPubKeys = this.extractPublicKeys(miniscript)

      if (!extractedPubKeys) throw new Error('Invalid miniscript policy')

      const _secretKey = generatePrivateKey()

      const sharedKey = {
        secretKey: _secretKey,
        publicKey: getPublicKey(_secretKey)
      }

      if (!sharedKey.secretKey || !sharedKey.publicKey) throw new Error('An error occurred while generating the shared key')

      const descriptor = fromMiniscriptPolicy(miniscript)

      if (!descriptor) throw new Error('Invalid miniscript policy')

      let policyContent = {
        name,
        description,
        descriptor,
        uiMetadata
      }
      policyContent = JSON.stringify(policyContent)
      const content = await nip04.encrypt(sharedKey.secretKey, sharedKey.publicKey, policyContent)

      if (!content) throw new Error('An error occurred while encrypting the policy content')

      const tags = extractedPubKeys?.map(pubkey => ['p', pubkey])

      const { event } = await this.BuildEvent({
        kind: EventKind.POLICY,
        content,
        tags: [...tags],
        pubkey: sharedKey.publicKey,
        toSign: {
          nip: '04',
          privateKey: sharedKey.secretKey
        }
      })
      const policyEventId = event?.id

      const sharedKeysEvents = []

      for (const pubkey of extractedPubKeys) {
        const encryptedSharedKey = await Nip07.encrypt(pubkey, sharedKey.secretKey)

        if (!encryptedSharedKey) throw new Error('An error occurred while encrypting the shared key')

        const { event: sharedKeyEvent } = await this.BuildEvent({
          kind: EventKind.SHARED_KEY,
          content: encryptedSharedKey,
          tags: [['e', policyEventId], ['p', pubkey]],
          pubkey: pubKey,
          signed: {
            nip: '07',
            privateKey: undefined
          }
        })
        sharedKeysEvents.push(sharedKeyEvent)
      }

      await this.publishPolicy({ policyEvent: event, sharedKeysEvents })

      const policies = await this.getPoliciesByAccount({ pubkey: pubKey }, [event], sharedKeysEvents)

      return { policies }
    } catch (error) {
      throw new Error(error)
    }
  }

  async publishPolicy ({ policyEvent, sharedKeysEvents }) {
    try {
      const pubPolicy = await this.pool.publish(this.relays, policyEvent)
      pubPolicy.on('ok', (response) => {
        console.log('ok [policy Event]', response)
      })
      pubPolicy.on('failed', reason => {
        console.log({ reason })
        console.log(`failed to publish [policy]: ${reason}`)
      })

      let counter = 0
      for (const sharedKeyEvent of sharedKeysEvents) {
        const pubsSharedKeys = await this.pool.publish(this.relays, sharedKeyEvent)
        pubsSharedKeys.on('ok', (response) => {
          console.log(`ok [shared key #${counter}`, response)
        })
        pubsSharedKeys.on('failed', reason => {
          console.log({ reason })
          console.log(`failed to publish [shared key #${counter}]: ${reason}`)
        })
        counter++
      }
    } catch (error) {
      throw new Error(error)
    }
  }

  extractPublicKeys (miniscript) {
    const regex = /pk\(([^)]+)\)/g // Regular expression to match public keys
    const matches = miniscript.match(regex) // Find all matches in the input string
    const publicKeys = matches.map(match => match.slice(3, -1)) // Extract the public keys by removing "pk(" and ")"
    return publicKeys || []
  }

  /**
   * Get all policies with shared keys
   * @param {string} pubkey
   * @returns {Promise<[]>}
   */
  // TODO: Add the logic when the user enter their private key
  async getPoliciesByAccount ({ pubkey }) {
    try {
      /**
       * Build event for list
       * @param {[]} events
       * @returns {[{kinds: *}]}
       */
      const buildEventForList = (events) => {
        return [{
          kinds: [...events]
        }]
      }
      const currentUserPubKey = pubkey

      // Get policies from the pool
      const policies = await this.pool.list(this.relays, buildEventForList([EventKind.POLICY]))

      // Get shared keys from the pool
      const allSharedKeys = await this.pool.list(this.relays, buildEventForList([EventKind.SHARED_KEY]))
      // Filter policies by pubkey
      const policiesFiltered = policies?.filter(policy => {
        const { tags } = policy
        return tags.some(tag => {
          const [type, value] = tag
          return type === 'p' && value === currentUserPubKey
        })
      })

      if (!policiesFiltered.length) return []

      // For each policy, get the shared key and decrypt the policy
      for (const policy of policiesFiltered) {
        // Get the policy id
        const { content: contentPolicy, id, pubkey: pubKeyPolicy, tags } = policy || {}

        // Get the shared key
        const sharedKey = allSharedKeys.find(sharedKey => {
          const { tags } = sharedKey || {}
          const [event, _pubkey] = tags || []

          const [type, value] = event || []
          const [typePub, valuePub] = _pubkey || []

          return type === 'e' && value === id && typePub === 'p' && valuePub === currentUserPubKey
        })

        if (!sharedKey) throw new Error('Shared key not found')

        // Get the shared key's pubkey
        const { content: contentSharedKeys, pubkey: pubkeyOfSharedKey } = sharedKey || {}

        const pubKeySharedArray = tags.filter(tag => {
          const [type, value] = tag
          return type === 'p' && value !== currentUserPubKey
        })

        if (!contentSharedKeys || !pubKeySharedArray.length === 0) throw new Error('Unable to get shared key')

        const privKeyShared = await Nip07.decrypt(pubkeyOfSharedKey, contentSharedKeys)

        if (!privKeyShared) throw new Error('Unable to get private key from shared key')

        // Decrypt the policy using the shared key
        const decryptedPolicy = await nip04.decrypt(privKeyShared, pubKeyPolicy, contentPolicy)

        const parsedPolicy = JSON.parse(decryptedPolicy)

        if (!parsedPolicy) throw new Error('Unable to parse policy')

        policy.plainText = parsedPolicy
      }
      console.log({ policiesFiltered })
      return policiesFiltered
    } catch (error) {
      throw new Error(error)
    }
  }

  async subscriptionToMessages ({ hexPublicKey }, subTrigger) {
    const event = {
      kinds: [EventKind.DM],
      authors: [hexPublicKey]
    }
    const sub = this.pool.sub(this.relays, [event])
    sub.on('event', event => {
      subTrigger(event)
    })
    return sub
  }

  /**
   * Decrypts a message using the wallet Extension and the sender public key
   * @async
   * @function
   * @param {string} publicKey - A public key
   * @param {string} message - An encrypted message
   * @returns {Promise.<string>} - The decrypted message
   * @throws {Error} - If either the publicKey or message is missing or invalid, or if there's an error decrypting
   */
  async decryptMessage ({ publicKey, message }) {
    if (!publicKey || !message) {
      throw new Error('Missing params')
    }
    if (typeof publicKey !== 'string' || typeof message !== 'string') {
      throw new Error('Invalid params')
    }

    try {
      const response = await Nip07.decrypt(publicKey, message)
      return response
    } catch (e) {
      throw new Error(e)
    }
  }

  HexToNpub ({ publicKey }) {
    return nip19.npubEncode(publicKey)
  }

  NpubToHex ({ publicKey }) {
    const { type, data } = nip19.decode(publicKey)
    return { type, data }
  }

  getRelay () {
    return this.relay
  }

  getRelays () {
    return this.relays
  }

  setRelays ({ relays }) {
    this.relays = [...relays]
  }

  setRelay ({ relay }) {
    this.relay = relay
  }
}

export default NostrApi
