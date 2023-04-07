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
  async savePolicy ({ name, description, descriptor, uiMetadata, pubKey }) {
    try {
      const extractedPubKeys = this.extractPublicKeys(uiMetadata, pubKey)

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
      const tags = extractedPubKeys?.map(pubkey => ['p', pubkey])

      const { event } = await this.BuildEvent({
        kind: EventKind.POLICY,
        content,
        tags: [...tags],
        pubkey: sharedKey.publicKey,
        signed: true
      })
      const policyEventId = event?.id
      // TODO: publish the policy event
      // const pubs = await this.pool.publish(this.relays, event)
      const sharedKeysEvents = []

      for (const pubkey of extractedPubKeys) {
        const encryptedSharedKey = await Nip07.encrypt(pubkey, sharedKey.secretKey)

        const { event: sharedKeyEvent } = await this.BuildEvent({
          kind: EventKind.SHARED_KEY,
          content: encryptedSharedKey,
          tags: [['e', policyEventId], ['p', pubkey]],
          pubkey: pubKey,
          signed: true
        })
        sharedKeysEvents.push(sharedKeyEvent)
        // TODO: publish the shared keys event
        // const pubsSharedKeys = await this.pool.publish(this.relays, sharedKeyEvent)
      }
      console.log({ policyEvent: event, sharedKeysEvents })
      console.log('Getting the policy event...')

      await this.publishPolicy({ policyEvent: event, sharedKeysEvents })
      await this.getPoliciesByAccount({ pubkey: pubKey, policies: [event], allSharedKeys: sharedKeysEvents })

      return { policyEvent: event, sharedKeysEvents }
    } catch (error) {
      throw new Error(error)
    }
  }

  async publishPolicy ({ policyEvent, sharedKeysEvents }) {
    try {
      for (const sharedKeyEvent of sharedKeysEvents) {
        const pubsSharedKeys = await this.pool.publish(this.relays, sharedKeyEvent)
        pubsSharedKeys.on('ok', (response) => {
          console.log('ok', response)
        })
        pubsSharedKeys.on('failed', reason => {
          console.log(`failed to publish: ${reason}`)
        })
      }

      const pubPolicy = await this.pool.publish(this.relays, policyEvent)
      pubPolicy.on('ok', (response) => {
        console.log('ok', response)
      })
      pubPolicy.on('failed', reason => {
        console.log(`failed to publish: ${reason}`)
      })
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
      descriptor
    }
  }

  fromMiniscriptPolicy ({ name, description, descriptor }) {
    // Call method from WASM
  }

  extractPublicKeys (uiMetadata, pubKey) {
    const { keys } = uiMetadata || {}

    if (!keys?.includes(pubKey)) {
      keys.push(pubKey)
    }

    return keys || []
  }

  /**
   * Get all policies with shared keys
   * @param {string} pubkey
   * @returns {Promise<[]>}
   */
  // TODO: Add the logic when the user enter their private key
  async getPoliciesByAccount ({ pubkey, policies, allSharedKeys }) {
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
      // const policies = await this.pool.list(this.relays, buildEventForList([EventKind.POLICY]))
      const policies = [
        {
          pubkey: '7b744caf2653146c51da1f60192f346d713b07a04948376dfeb9c2fa9fbbd217',
          kind: 9289,
          content: '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?iv=v5tAkM1QfvEJ2jL/mhQcWA==',
          tags: [
            [
              'p',
              '7414b2d02d5867da861a50c62f537bd7250e364cf3c9254ad574012be5bf7294'
            ],
            [
              'p',
              'ecea6a3d540010fdec7364135eb065d02aec3d7e04816291f3bb17fc12bb98fd'
            ]
          ],
          created_at: 1680824169,
          id: 'e4c03b309c94ac119c00af8fea2535278cb2dae45b9ea4fcedb5b42274cec49b',
          sig: 'b45f784bcbb932bfc20fb9c7bfb2a2b1c848b3a9f34ef7893bc7386b0af8241010e4ed6cacece143230ae121503ec9305c45373dd7ec4a2b6697821ceec6113f'
        },
        {
          pubkey: '72a1c0a2d5e64d06d141045fd8e52421eb452d1e26d85c3a096f0024708ec2ef',
          kind: 9289,
          content: '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?iv=rNOZj2l0dP46XZycpmLr7Q==',
          tags: [
            [
              'p',
              'c6f64f59ad24ff8a08930b286144b8088fe4ac508017dbab8194b3d20c6d5465'
            ],
            [
              'p',
              'ecea6a3d540010fdec7364135eb065d02aec3d7e04816291f3bb17fc12bb98fd'
            ]
          ],
          created_at: 1680824723,
          id: '6ccd9ed62060480ab455e85666c0b97ae6d16f0ac099b39a253337a021788f03',
          sig: 'c9f231693f3664e7f387f33cffbf83ee908d66f384094f8429e4549ae1d850ebab68a3ca7d854d616a3b1eaf3c7e86b831649dc35cfb9e7c193d71f1114c46df'
        }
      ]
      // Get shared keys from the pool
      // const allSharedKeys = await this.pool.list(this.relays, buildEventForList([EventKind.SHARED_KEY]))
      const allSharedKeys = [
        {
          pubkey: 'ecea6a3d540010fdec7364135eb065d02aec3d7e04816291f3bb17fc12bb98fd',
          kind: 9288,
          content: 'pwVrcOU2L52mTmX7JLSHlVEIEzdndjezKwLMywcX+lcdgkr4zeVw/F6hQFmgGnocbSmrJPdQPo2irKp1HqKJPON9cvEXzYsPmIIbPSVbqas=?iv=uBf0u2jWef9mYUQEu8l5aQ==',
          tags: [
            [
              'e',
              'e4c03b309c94ac119c00af8fea2535278cb2dae45b9ea4fcedb5b42274cec49b'
            ],
            [
              'p',
              '7414b2d02d5867da861a50c62f537bd7250e364cf3c9254ad574012be5bf7294'
            ]
          ],
          created_at: 1680824172,
          id: 'f7033d9eed2d6d8bb84c4b13873b3232680df1665954f3b670dff83bd715b3e4',
          sig: 'ae47d05f6de7ab55b45976cf136509f6cd081152b218fc79f3609a6ff93d0d3a5540d83f4b941bf8dc8c37aad58f5c4754888e28b16f462821e3b6c3547d73d1'
        },
        {
          pubkey: 'ecea6a3d540010fdec7364135eb065d02aec3d7e04816291f3bb17fc12bb98fd',
          kind: 9288,
          content: 'OhDLBLNIaOEjh+xeCx8uxEqqEYi75odRdIzASAyBwJrkO/eGMTVYtnlC3B28nRh0wC1E2yW+fuze36qqTJRFar0tx/DGWumycy17sGcUcRY=?iv=ydIt7Gn0rXFqCotnxH+wvQ==',
          tags: [
            [
              'e',
              'e4c03b309c94ac119c00af8fea2535278cb2dae45b9ea4fcedb5b42274cec49b'
            ],
            [
              'p',
              'ecea6a3d540010fdec7364135eb065d02aec3d7e04816291f3bb17fc12bb98fd'
            ]
          ],
          created_at: 1680824176,
          id: '13adc29fb40d2b861339c8099f565a26d3a300845ae73818feb7a1f4009310c6',
          sig: '56476e917bdb888bfda9d986e0eaa3ffd6aa8949d19e4c6013ece0b33fba656b38b81861a888bb6694613beb722796dcb698c1037489576ab2abf422d16a267f'
        },
        {
          pubkey: 'ecea6a3d540010fdec7364135eb065d02aec3d7e04816291f3bb17fc12bb98fd',
          kind: 9288,
          content: 'nVeCOdvRZ1NhX4SVyd4iZMXH+2bBfGQRpu7QnplpDMMBUrtYN8UejhpQ10mc+FH0gUtX0QNc+2lj1JFI0c8dPthcvFmhaiVGZaJFW9pYWDQ=?iv=0zNyKcI+bqvFqO73uRPq1w==',
          tags: [
            [
              'e',
              '6ccd9ed62060480ab455e85666c0b97ae6d16f0ac099b39a253337a021788f03'
            ],
            [
              'p',
              'c6f64f59ad24ff8a08930b286144b8088fe4ac508017dbab8194b3d20c6d5465'
            ]
          ],
          created_at: 1680824739,
          id: '4b06951488c4b89986e36b21441fc4c4d3e9f6fd7466d885a0fa8eae994fd785',
          sig: '4a88ef4d249f2fcd6e580e69994bf4eb951d461000ef37942dc4086fe61e1f17ac53bebdcb4c242bb191725535651c549bb57d577d2abe7d24000509b149c145'
        },
        {
          pubkey: 'ecea6a3d540010fdec7364135eb065d02aec3d7e04816291f3bb17fc12bb98fd',
          kind: 9288,
          content: 'qrrshwDeFoI1F/DYm+a2nSCMkXPO+y+CNv4aEEA4kI60t+dOJBgSkuQ3+n2r5Mxf0ayHNvKXEV9vgIFiHxASizCrZrVlodqnW7x8AY3dHxQ=?iv=+yazud7J5sAnRf++zqqgoA==',
          tags: [
            [
              'e',
              '6ccd9ed62060480ab455e85666c0b97ae6d16f0ac099b39a253337a021788f03'
            ],
            [
              'p',
              'ecea6a3d540010fdec7364135eb065d02aec3d7e04816291f3bb17fc12bb98fd'
            ]
          ],
          created_at: 1680824742,
          id: 'b34b2a051c3f742aad46dceae826d1e406afd5ab5631ca451fe44f494e93989c',
          sig: 'c4d0351c9bf3ba94c98c53441df0dc7a3a2a87c1f452c523d95d6187a46c3c3b5d8f9c5ebd6f7719bbaef2e14784134485963b593d369e605a1b9fde1aa65d92'
        }
      ]
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
