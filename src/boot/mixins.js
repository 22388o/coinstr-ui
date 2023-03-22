/* eslint-disable dot-notation */
// import { customIcons } from '~/mixins/icons'

import HInput from '~/components/common/input/h-input.vue'
import MoneyInput from '~/components/common/input/money-input.vue'

export default async ({ app }) => {
  // app.mixin(customIcons)
  app.component('HInput', HInput)
  app.component('MoneyInput', MoneyInput)
}
