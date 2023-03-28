export function setNostrAccount (state, dataObj) {
  state.account = { ...dataObj }
}
export function setPublicKey (state, pk) {
  state.publicKey = pk
}
export function setPrivateKey (state, pv) {
  state.privatekey = pv
}

export function clearNostrAccount (state) {
  state.account = {}
}

export function updateNostrAccount (state, dataObj) {
  const property = 'profile'
  if (!Object.prototype.hasOwnProperty.call(state?.account, property)) {
    state.account[property] = {}
  }
  for (const prop in dataObj) {
    state.account.profile[prop] = dataObj[prop]
  }
}

export function updateRelays (state, relays) {
  state.relays = [...relays]
}

export function addOwnMessage (state, message) {
  state.ownMessages.push(message)
}
export function clearOwnMessages (state) {
  state.ownMessages = []
}
