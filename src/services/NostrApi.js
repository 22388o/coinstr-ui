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

  async BuildEvent ({ kind, content, tags, pubkey, signed = false }) {
    const event = {
      pubkey,
      kind,
      content,
      tags,
      created_at: Math.floor(Date.now() / 1000)
    }
    if (signed) {
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
        signed: true
      })
      const pubs = this.pool.publish(this.relays, event)
      pubs.on('ok', (response) => {
        // this may be called multiple times, once for every relay that accepts the event
        console.log('ok', response)
        subTrigger(response)
      })
      pubs.on('failed', reason => {
        console.log(`failed to publish: ${reason}`)
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

  async savePolicy ({ name, description, descriptor, uiMetadata, pubKey }) {
    try {
      const extractedPubKeys = this.extractPublicKeys(descriptor)

      const _secretKey = generatePrivateKey()

      const sharedKey = {
        secretKey: _secretKey,
        publicKey: getPublicKey(_secretKey)
      }
      const policy = this.fromDescriptionOrPolicy({ name, description, descriptor })

      let message = {
        ...policy,
        uiMetadata
      }
      message = JSON.stringify(message)
      const content = await nip04.encrypt(sharedKey.secretKey, sharedKey.publicKey, message)
      const tags = extractedPubKeys.map(pubkey => ['p', pubkey])

      const { event } = await this.BuildEvent({
        kind: EventKind.POLICY,
        content,
        tags: [...tags],
        pubkey: sharedKey.publicKey,
        signed: true
      })
      const policyEventId = event?.id

      const pubs = await this.pool.publish(this.relays, event)

      for (const pubkey of extractedPubKeys) {
        const encryptedSharedKey = await Nip07.encrypt(pubkey, sharedKey.secretKey)

        const { event: sharedKeyEvent } = await this.BuildEvent({
          kind: EventKind.SHARED_KEY,
          content: encryptedSharedKey,
          tags: [['e', policyEventId], ['p', pubkey]],
          pubkey: pubKey,
          signed: true
        })

        const pubsSharedKeys = await this.pool.publish(this.relays, sharedKeyEvent)
      }

      return event
    } catch (error) {
      throw new Error(error)
    }
  }

  fromDescriptionOrPolicy ({ name, description, descriptor }) {
    const fromDescriptor = this.fromDescriptor({ name, description, descriptor })

    if (fromDescriptor) return fromDescriptor

    return this.fromMiniscriptPolicy({ name, description, descriptor })
  }

  fromDescriptor ({ name, description, descriptor }) {
    // pub fn from_descriptor<S>(name: S, description: S, descriptor: S) -> Result<Self, Error>
    // where
    //     S: Into<String>,
    // {
    //     let descriptor = Descriptor::from_str(&descriptor.into())?;
    //     Self::new(name, description, descriptor)
    // }

    return {
      name,
      description,
      descriptor: "tr('ec85f285501b21ee511f351cfa9312f4e9af77a719b63bfaeb7fba8fecee5f69',[B/duesm]multi_a(2,5e61551ceb04521181d9ad40295e32dce5dc5609c4612a3239dbc60c30080dcd,d223b67e6091ef0665188a4016d20a51a7bbb1b240fafc4429bf1329527338d1))"
    }
  }

  fromMiniscriptPolicy ({ name, description, descriptor }) {
    // Call method from WASM
  }

  extractPublicKeys (descriptor) {
    return [
      'b16a94bddab7bf6a85de08d0ad6fe601418270598509ac6a23b7ba92c1015705', // frank
      'd62408188ab170d846028cd4fc61c47989cd1fb15bf5cb5d1d37016d85866bfb' // gary
    ]
  }

  /**
   * Get all policies with shared keys
   * @param {string} pubkey
   * @returns {Promise<[]>}
   */
  async getPoliciesByAccount ({ pubkey }) {
    console.log({ pubkey })
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
      // Get policies from the pool
      const policies = await this.pool.list(this.relays, buildEventForList([EventKind.POLICY]))
      // Get shared keys from the pool
      const allSharedKeys = await this.pool.list(this.relays, buildEventForList([EventKind.SHARED_KEY]))
      console.log({ allSharedKeys })
      // Filter policies by pubkey
      const policiesFiltered = policies?.filter(policy => {
        const { tags } = policy
        return tags.some(tag => {
          const [type, value] = tag
          return type === 'p' && value === pubkey
        })
      })
      if (!policiesFiltered.length) return []

      // For each policy, get the shared key and decrypt the policy
      for (const policy of policiesFiltered) {
        // Get the policy id
        const { content: contentPolicy, id, pubkey: pubKeyPolicy } = policy || {}

        // Get the shared key
        const sharedKey = allSharedKeys.find(sharedKey => {
          const { tags } = sharedKey || {}
          const [event, _pubkey] = tags || []

          const [type, value] = event || []
          const [typePub, valuePub] = _pubkey || []

          return type === 'e' && value === id && typePub === 'p' && valuePub === pubkey
        })

        if (!sharedKey) throw new Error('Shared key not found')

        // Get the shared key's pubkey
        const { content: contentSharedKeys, tags } = sharedKey || {}

        const pubKeyShared = tags?.[1]?.[1]

        if (!contentSharedKeys || !pubKeyShared) throw new Error('Unable to get shared key')
        // Decrypt the shared key
        const privKeyShared = await Nip07.decrypt(pubKeyShared, contentSharedKeys)
        if (!privKeyShared) throw new Error('Unable to get private key from shared key')

        // Decrypt the policy using the shared key
        const decryptedPolicy = await nip04.decrypt(privKeyShared, pubKeyPolicy, contentPolicy)

        const parsedPolicy = JSON.parse(decryptedPolicy)

        if (!parsedPolicy) throw new Error('Unable to parse policy')

        policy.plainText = parsedPolicy
      }
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
