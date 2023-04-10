<template lang='pug'>
#UsersListWrapper(data-testid="UsersListWrapper")
  q-list(
    bordered
    separator
    v-if="loading"
    data-testid="UsersListSkeleton"
  )
    q-item.full-width(v-for="n in 8")
      q-item-section(avatar)
        q-skeleton(type="QAvatar")
      q-item-section(top no-wrap)
        q-skeleton.q-mt-xs(bordered)
        q-skeleton.q-mt-xs(bordered)
      q-item-section
        q-skeleton.q-mt-xs.full-width(type="QBtn")
  q-list(
    v-if="showList"
    bordered
    separator
  )
    user-item(
      role="userItem"
      v-if="showList"
      v-for="user in filteredUsers"
      :user="user"
      interactive
      @onAddUser="addUserToPolicy"
      @onRemoveUser="removeUserToPolicy"
    )

</template>
<script setup>
import {
  defineProps,
  defineEmits,
  toRefs,
  computed
} from 'vue'
import UserItem from './user-item.vue'

// props
const props = defineProps({
  modelValue: {
    type: [Object, Array],
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: () => false
  },
  search: {
    type: String,
    default: undefined
  }
})
const { modelValue: _users, loading, search } = toRefs(props)

// Emits
const emits = defineEmits(['update:modelValue'])

// Methods by Feature
function addUserToPolicy (user) {
  _users.value.find(v => v === user).isSelectable = true
  emits('update:modelValue', _users.value)
}

function removeUserToPolicy (user) {
  _users.value.find(v => v === user).isSelectable = false
  emits('update:modelValue', _users.value)
}

const showList = computed(() => {
  if (!_users.value) return false
  if (Object.entries(_users)?.length > 0 && loading.value === false) return true
  return false
})

const filteredUsers = computed(() => {
  if (!_users.value || !search.value) return _users.value
  // eslint-disable-next-line array-callback-return
  return _users.value.filter(user => {
    const toMatch = `${user.name} ${user.displayName}`
    if (toMatch.toLowerCase().includes(search.value.toLowerCase())) return user
  })
})

</script>
