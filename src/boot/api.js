/* eslint-disable dot-notation */
import { showGlobalLoading, hideGlobalLoading, showGlobalNotification } from '~/composables/useNotifications'
import NostrApi from '~/services/NostrApi'

export default async ({ app, store }) => {
  try {
    const nostrApi = new NostrApi()

    store['$nostrApi'] = nostrApi
  } catch (e) {
    store['$connectedToServer'] = false
    showGlobalNotification({ message: e.message || e, color: 'negative' })
  } finally {
    hideGlobalLoading()
  }
}
