export function isLogged ({ profileName, loginType, polkadotAddress }) {
  return !!(polkadotAddress && profileName && loginType)
}

export function profileInfo (state) {
  return state
}

export function loginType ({ loginType }) {
  return loginType
}
