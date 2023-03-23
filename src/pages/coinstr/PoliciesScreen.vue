<template lang="pug">
#PoliciesScreen
  .row
    .col-8
      coinstr-blockly(
        ref="blocklyRef"
        @onChangedPolicy="validatePolicy"
        :eligiblesKeys="eligiblesContacts"
        :myPublicKey="myPublicKey"
      )
      .row.q-mt-sm
        .box.col.q-pr-sm
          .text-body2.text-bold Policy code:
          .text-body2.text-weight-light {{ policy }}
        .row.justify-end.q-gutter-x-sm(v-if="isLoggedInNostr")
          q-btn(
            label="Save policy"
            color="primary"
            @click="savePolicy"
          )
          q-btn(
            label="Load policy"
            color="secondary"
            @click="loadPolicy"
          )
    .col.q-pl-md
      template(v-if="isLoggedInNostr")
        .text-body2.text-bold Contacts:
        users-list.list(v-model="contacts" :loading="contacts === undefined")
      template(v-else)
        .text-body2.text-center.q-mt-md Please log in with your NOSTR account to see your contacts and add them to Policy.
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import CoinstrBlockly from '~/components/coinstr/coinstr-blockly'
import UsersList from '~/components/coinstr/users-list.vue'
import { useNostr, useNotifications } from '~/composables'
import { useStore } from 'vuex'

const $store = useStore()
const {
  getContacts
} = useNostr()

const {
  handlerError
} = useNotifications()

const blocklyRef = ref(undefined)
const policy = ref(undefined)
const contacts = ref(undefined)

const isLoggedInNostr = computed(() => $store.getters['nostr/isLoggedInNostr'])
const myPublicKey = ref(undefined)

watch(isLoggedInNostr, function (v) {
  try {
    loadContacts()
  } catch (e) {
    console.error(e)
  }
})

onMounted(() => {
  try {
    loadContacts()
  } catch (e) {
    console.error(e)
    handlerError(e)
  }
})

async function loadContacts () {
  const pubkey = $store.getters['nostr/getActiveAccount']
  if (isLoggedInNostr.value) {
    myPublicKey.value = pubkey.hex
    const data = await getContacts({ publicKey: pubkey.hex })
    contacts.value = data
  } else contacts.value = undefined
}

function generateCode () {
  const result = blocklyRef.value.generateCode()
  policy.value = result
}

function validatePolicy (code) {
  policy.value = code
}

// Computed
const eligiblesContacts = computed(() => {
  if (!contacts.value) return []
  const _contacts = Object.entries(contacts.value).map(([pk, user]) => {
    const label = user.display_name || user.name
    const isSelectable = user.isSelectable
    return {
      label,
      pk,
      isSelectable
    }
  }).filter(user => user.isSelectable)
  return _contacts
})

// Save and load policies
function savePolicy () {
  try {
    const textDom = blocklyRef.value.saveWorkspace()
    const serializer = new XMLSerializer()
    const xmlString = serializer.serializeToString(textDom)
    console.log('textDom', xmlString)
  } catch (e) {
    console.error(e)
    handlerError(e)
  }
}

function loadPolicy () {
  try {
    const textDom = blocklyRef.value.loadWorkspace('<xml xmlns="https://developers.google.com/blockly/xml"><block type="begin" id="fhvDsNw3*.VU$cV6SMCP" deletable="false" editable="false" x="260" y="10"><field name="SPACE"> </field><next><block type="thresh" id="legm[c#8{6p|7LgtWM+U"><field name="Threshold">2</field><field name="SPACE"> </field><statement name="Statements"><block type="pk" id="4LaeJ~om@4Rh^^]0#q^!"><value name="Key"><block type="my_key" id="`2:3Y+xxr4QzW/Suy(U3"/></value><next><block type="pk" id="twg~B+CM9ev)F#F.IP2Q"><value name="Key"><block type="key" id="Rqnd_;hpe4]qxO#u9l3~"><field name="Key">0dd81025a7b83c6f432b7afe1591417a4074b2e64b9824990a4f5709eb566320</field></block></value><next><block type="pk" id="MKtOo#(2*Fk-V5#dIW4B"><value name="Key"><block type="key" id="5}$@T%dgp9q88#]S:f^L"><field name="Key">52326c7af56507c99c08d8491adaa7afd0c44e2a1a3b9fdedf654e6336e890a2</field></block></value><next><block type="pk" id=")KaYLM;0fsxA.im?TPp["><value name="Key"><block type="key" id=")d%z;^T$h5_^JP}a~h-k"><field name="Key">7414b2d02d5867da861a50c62f537bd7250e364cf3c9254ad574012be5bf7294</field></block></value><next><block type="pk" id="C,6^O$s_~+DLg2|(iXF@"><value name="Key"><block type="key" id="fl#Y2AB^0ypwBa,KuBU;"><field name="Key">c6f64f59ad24ff8a08930b286144b8088fe4ac508017dbab8194b3d20c6d5465</field></block></value></block></next></block></next></block></next></block></next></block></statement></block></next></block></xml>')
  } catch (e) {
    console.error(e)
    handlerError(e)
  }
}
// --
</script>

<style lang="stylus" scoped>
.box
  inline-size: 150px
  overflow-wrap: break-word

.list
  height: 85vh
  overflow-y: scroll
</style>
