<template lang='pug'>
q-item
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
      about: 'Water well',
      name: 'Amanda',
      nip05: 'amanda@waterwell.ngo',
      npub: 'npub1phvpqfd8hq7x7set0tlpty2p0fq8fvhxfwvzfxg2fatsn66kvvsq2tag8v',
      picture: 'https://waterwell.ngo/profiles/amanda.png',
      banner: 'https://nostr.build/i/nostr.build_e34050e635c540aa737baef0ae9637b90469b8b5c7102209e95de6eb32e4b7a1.jpeg',
      lud06: 'lnbc1pjpr7k2pp5p8u3h6a9k8r0gffrt8t3zd2s7glmqg262wlvlsyfj8p73tdztl4qdqqcqzzgxqyz5vqrzjqwnvuc0u4txn35cafc7w94gxvq5p3cu9dd95f7hlrh0fvs46wpvhdldjcfs3eg3jr5qqqqryqqqqthqqpyrzjqw8c7yfutqqy3kz8662fxutjvef7q2ujsxtt45csu0k688lkzu3ldldjcfs3eg3jr5qqqqryqqqqthqqpysp5y9uwpnqspjmxpngwull43q5rnktuvaq0etpth0kzpsnmeg3r48lq9qypqsqu0wyhfvz0p5nnqqawh84pppw75w4r2w9uu9av4pvwech6n7zygnxd5jxd2m0l2ru8qq8e9tnhxdva36xevv8nlhgtt6t830rngqk3pqqgkv0uh',
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
