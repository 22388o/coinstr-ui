/* eslint-disable dot-notation */
// import Vue from 'vue'
import notifications from '~/mixins/notifications'
import { customIcons } from '~/mixins/icons'
import TInput from '~/components/common/input/t-input.vue'
// import { validation } from '~/mixins/validation'
export default async ({ app }) => {
  app.mixin(notifications)
  app.mixin(customIcons)
  app.component('TInput', TInput)
  // app.mixin(validation)
}
