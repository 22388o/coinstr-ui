<template lang="pug">
q-item(dense @click="openFile" clickable data-testid="fileElement")
  q-item-section(avatar)
    q-icon(v-if="!loading" name="file_open" color="primary")
    q-spinner(
      v-else
      color="primary"
      size="sm"
    )
  q-item-section
    .text-caption(data-testid="displayName") {{ displayName }}
  q-item-section(avatar)
    .text-caption.q-mr-xs(data-testid="fileSize") {{getSizeInKb}}
  slot
</template>

<script>
import BrowserIpfs from '~/services/BrowserIpfs.js'

export default {
  name: 'FileItem',
  props: {
    cid: {
      type: String,
      default: undefined
    },
    payload: {
      type: File,
      default: undefined
    },
    displayName: {
      type: String,
      default: undefined
    }
  },
  data () {
    return {
      loading: false
    }
  },
  computed: {
    getSizeInKb () {
      const size = this.payload?.size || 0
      if (size < 1024) return `${size} B`
      if (size < 1048576) return `${(size / 1024).toFixed(2)} KB`
      if (size < 1073741824) return `${(size / 1048576).toFixed(2)} MB`
      return `${(size / 1073741824).toFixed(2)} GB`
    }
  },
  methods: {
    async openFile () {
      if (this.payload instanceof File) {
        const url = URL.createObjectURL(this.payload)
        window.open(url, '_blank')
      } else {
        try {
          this.loading = true
          const file = await BrowserIpfs.retrieve(this.cid)
          window.open(URL.createObjectURL(file.payload))
        } catch (e) {
          this.handlerError(e)
        } finally {
          this.loading = false
        }
      }
    }
  }
}
</script>
