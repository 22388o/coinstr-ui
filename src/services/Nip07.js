
export default class Nip07 {
  static isAvailable () {
    return !!window.nostr
  }

  static enforceAvailable () {
    if (!Nip07.isAvailable()) throw new Error('Nostr account not detected within extension')
  }

  static getPublicKey () {
    Nip07.enforceAvailable()
    return window.nostr.getPublicKey()
  }

  static signEvent (event) {
    Nip07.enforceAvailable()
    return window.nostr.signEvent(event)
  }

  static encrypt (pubkey, plaintext) {
    Nip07.enforceAvailable()
    return window.nostr.nip04.encrypt(pubkey, plaintext)
  }

  static decrypt (pubkey, ciphertext) {
    Nip07.enforceAvailable()
    // Flaming Wallet do not use this method
    return window.nostr.nip04?.decrypt(pubkey, ciphertext)
  }
}
