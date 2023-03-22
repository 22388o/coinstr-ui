export function setProfile (state, { profilePicture, profileName, loginType }) {
  state.profilePicture = profilePicture
  state.profileName = profileName
  state.loginType = loginType
}

export function cleanProfile (state) {
  state.profilePicture = undefined
  state.profileName = undefined
  state.loginType = undefined
}
