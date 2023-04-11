<template lang='pug'>
div
  .label.text-white {{ label }}
  q-input.c-input.c-input-bg(
    outlined
    v-model="value"
    v-bind="$attrs"
    :data-testid="testid"
  )
    slot(name='append' class="centerIcon")
</template>

<script>
export default {
  name: 'HInput',
  props: {
    /**
         * The value of the input
         * @type {String}
         * @default ''
         * @required
         */
    modelValue: {
      type: [String, Number],
      default: '',
      required: true
    },
    label: {
      type: String,
      default: '',
      required: false
    },
    // eslint-disable-next-line vue/prop-name-casing
    testid: {
      type: String,
      default: 'HInput'
    },
    /**
         * InputFormatting
         * @type {Boolean}
         * @default false
         */
    inputFormatting: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  computed: {
    value: {
      get () {
        return this.modelValue
      },
      set (value) {
        this.$emit('update:modelValue', value)
      }
    }
  }
}
</script>

<style lang="stylus" scoped>
.q-field__marginal
  font-size: 16px
.colorTailwind
  color: #374157
</style>
