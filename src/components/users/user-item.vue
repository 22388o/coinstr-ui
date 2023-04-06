<template lang='pug'>
q-item(test data-testid="userItem")
  q-item-section(top avatar)
    q-img.img(v-if="isValidPicture" :src="_user.picture" width="50px" height="50px")
    q-avatar.img(v-else color="secondary" text-color="white" font-size="15px" size="50px") User
  q-item-section(top no-wrap)
      q-item-label(lines="5")
        .row.q-gutter-xs
          .text-weight-bold {{ _user.name || _user.displayName }}
          q-icon(
            v-if="_user.nip05"
            name="verified"
            color="pink"
            size="1rem"
          )
            q-tooltip NIP05 verified
          q-item-label(v-if="_user.nip05") {{ getNip05 }}
      q-item-label(lines="2")
        .npub.cursor-pointer(
          :class="{'q-mt-xs': !_user.name && !_user.displayName}"
          @click="copyTextToClipboard(getNpub.raw)"
        )
          //- span.text-overline.text-weight-bolder npub
          span.text-body2 {{ getNpub.display }}
  q-item-section(v-if="interactive")
    q-btn(
      :label="policyButtonLabel"
      no-caps
      @click="updateToPolicy"
      data-testid="interactWithPolicyBtn"
    )
</template>
<script setup>
import {
  defineProps,
  toRefs,
  computed,
  defineEmits
} from 'vue'
import { useNotifications } from '~/composables'

// props
const props = defineProps({
  user: {
    type: Object,
    default: () => ({
      about: '',
      name: '',
      nip05: '',
      npub: '',
      picture: '',
      banner: '',
      lud06: '',
      isSelectable: false
    })
  },
  interactive: {
    type: Boolean,
    default: false,
    required: false
  }
})
// Emits
const emits = defineEmits(['onAddUser', 'onRemoveUser'])

// Methods by Feature
const { copyTextToClipboard } = useNotifications()
const { user: _user } = toRefs(props)
const hasMetadata = computed(() => {
  const hasNpub = Object.prototype.hasOwnProperty.call(_user.value, 'npub')
  const hasPicture = Object.prototype.hasOwnProperty.call(_user.value, 'picture')
  const hasName = Object.prototype.hasOwnProperty.call(_user.value, 'name')
  return hasPicture && hasName && hasNpub
})
const isValidPicture = computed(() => {
  return isValidURL(_user.value?.picture)
})
const isValidURL = (url) => {
  const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i
  return urlRegex.test(url)
}
const getNpub = computed(() => {
  const npub = _user.value.npub
  if (!npub) return ''

  const prefix = 'npub'
  return {
    raw: npub,
    display: npub.substring(prefix.length, 9) + '...' + npub.substring(npub.length - 5)
  }
})
const getNip05 = computed(() => {
  const identifier = '@'
  const [name, organization] = _user.value.nip05.split('@')
  return organization
})

// Policy
function updateToPolicy () {
  try {
    if (isAddedToPolicy.value) {
      emits('onRemoveUser', props.user)
      return
    }
    emits('onAddUser', props.user)
  } catch (e) {
    console.error(e)
  }
}

const isAddedToPolicy = computed(() => {
  return props.user.isSelectable
})

const policyButtonLabel = computed(() => {
  if (isAddedToPolicy.value) return 'Added'
  return 'Add to Policy'
})
// -
</script>
<style lang='stylus' scoped>
.img
  border-radius: 50%
.npub:hover
  text-decoration: underline
</style>
