export const hashedLogin = async function ({ commit }, { userAddress, returnTo }) {
  try {
    const isLoggedIn = await this.$hashedPrivateApi.isLoggedIn()
    console.log('isLoggedIn', isLoggedIn)
    localStorage.setItem('autoLoginAccount', userAddress)
    const to = returnTo || { name: 'root' }
    if (isLoggedIn) {
      commit('setIsHashedLoggedIn', isLoggedIn)
      this.$router.push(to)
    } else if (!isLoggedIn && userAddress) {
      await this.$hashedPrivateApi.login(userAddress)
      commit('setIsHashedLoggedIn', true)
      console.log('returnUrl', to)
      this.$router.push(to)
    }
  } catch (e) {
    throw new Error(e)
  }
}

export const hashedAutoLogin = async function ({ commit, dispatch }, { returnTo }) {
  try {
    console.log('hashedAutoLogin')
    if (localStorage.getItem('autoLoginAccount')) {
      await dispatch('hashedLogin', { returnTo, userAddress: localStorage.getItem('autoLoginAccount') })
    }
  } catch (e) {
    throw new Error(e)
  }
}

export const hashedLogout = async function ({ commit }) {
  try {
    console.log('hashedLogout')
  } catch (error) {
    console.log('Authenticator logout error', error)
  }
  localStorage.removeItem('autoLoginAccount')
  this.$router.push({ name: 'login' })
}
