import {
  relayInit,
  getPublicKey,
  getEventHash,
  signEvent,
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
    // retornar sub (useProofOfReserves)
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

  async sendMessage ({ from, to, ciphertext }, subTrigger) {
    try {
      const { hex } = from || {}

      const event = {
        pubkey: hex,
        kind: EventKind.DM,
        tags: [['p', to]],
        content: ciphertext,
        created_at: Math.floor(Date.now() / 1000)
      }

      event.id = getEventHash(event)
      const { sig } = await Nip07.signEvent(event)
      event.sig = sig
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

  async decryptMessage ({ publicKey, message }) {
    const response = await Nip07.decrypt(publicKey, message)
    return response
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
