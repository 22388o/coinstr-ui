import { Notify, QSpinnerFacebook, Loading, QSpinnerPuff, debounce } from 'quasar'
import { mapErrors } from '~/const/HashedErrors'

export const showGlobalNotification = ({ message, color = 'accent', icon = 'done' }) => {
  return Notify.create({
    message: `<div class="text-center"> ${message} </div>`,
    classes: 'c-notification',
    color,
    position: 'bottom',
    timeout: 10000,
    progress: true,
    icon,
    html: true,
    actions: [
      { icon: 'close', color: 'white', handler: () => { /* ... */ } }
    ]
  })
}

const handlerError = (error) => {
  const message = error.message || error
  const isErrorOnMaps = mapErrors.find(e => message.includes(e.code))
  let errorMessage = message
  if (isErrorOnMaps) {
    errorMessage = isErrorOnMaps.message
  }
  console.error(errorMessage)
  Notify.create({
    message: `<div class="text-center"> ${errorMessage} </div>`,
    classes: 'c-notification',
    color: 'negative',
    position: 'bottom',
    timeout: 20000,
    // closeBtn: true,
    icon: 'error',
    html: true,
    progress: true,
    actions: [
      { icon: 'close', color: 'white', handler: () => { /* ... */ } }
    ]
  })
}

/**
 * This function is used globally to show loadings in vue2, vue3 and out of quasar components
 * @param {String} message Message to show
 * @param {String} color Text color
 * @param {String} background Background for loading
 * @param {String} type Spinner switcher
 */
export const showGlobalLoading = (props) => {
  let message, color, background, type
  const defaultMessage = 'Retrieving data...'
  const defaultColor = 'white'
  const defaultBackground = 'black'
  const defaultType = 'loading'

  if (props) {
    message = props.message || defaultMessage
    color = props.color || defaultColor
    background = props.background || defaultBackground
    type = props.type || defaultType
  } else {
    message = defaultMessage
    color = defaultColor
    background = defaultBackground
    type = defaultType
  }

  // Get spinner
  let spinner
  switch (type) {
  case 'loading':
    spinner = QSpinnerPuff
    break
  case 'listening':
    // spinner = QSpinnerFacebook
    spinner = QSpinnerFacebook
    break
  default:
    spinner = QSpinnerFacebook
  }

  // <img src="/icons/proxy-logo.png" style="width: 40px; height: 40px;" class="absolute-center"/>
  const htmlMessage = `<div>
    <div style="height: 250px;">
      <lottie-player src="/animations/proxy-loading.json"  background="transparent"  speed="1"  style="width: 350px; height: 350px;" class="absolute-center"  loop autoplay />
    </div>
    <div class="text-h5 text-white bg-dark-gradient">${message}</div>
  </div>`

  Loading.show({
    spinner,
    // spinnerColor: color,
    spinnerSize: 0,
    backgroundColor: background,
    // message: `<div class="text-h5">${message}</div>`,
    message: htmlMessage,
    messageColor: color,
    html: true
  })
}

export const hideGlobalLoading = () => {
  Loading.hide()
}

export function useNotifications () {
  const showNotification = showGlobalNotification
  const showLoading = debounce(showGlobalLoading, 1)
  const hideLoading = debounce(hideGlobalLoading, 1000)

  function copyTextToClipboard (data) {
    try {
      navigator.clipboard.writeText(data).then(e => {
        this.showNotification({ message: 'Text copied to clipboard' })
      })
    } catch (e) {
      console.error('error', e)
      this.handlerError(e.message || e)
    }
  }

  return {
    showNotification,
    showLoading,
    hideLoading,
    copyTextToClipboard,
    handlerError
  }
}
