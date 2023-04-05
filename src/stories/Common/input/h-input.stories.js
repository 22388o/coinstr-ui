// import { expect } from '@storybook/jest'
import HInput from '~/components/common/input/h-input.vue'
import { within, userEvent } from '@storybook/testing-library'
import { ref } from 'vue'
// import { expect } from '@storybook/jest'
export default {
  title: 'Common/HInput',
  component: HInput,
  argTypes: {
    type: {
      name: 'type',
      control: {
        type: 'select',
        options: ['text', 'textarea']
      }
    }
  }
}

const Template = (args) => ({
  // Components used in your story `template` are defined in the `components` object
  components: { HInput },
  // The story's `args` need to be mapped into the template through the `setup()` method
  setup () {
    // Story args can be spread into the returned object
    const data = ref(undefined)
    return { args, data }
  },
  // Then, the spread values can be accessed directly in the template
  template: '<HInput v-bind="args" v-model="data" />'
})

export const BaseInput = Template.bind({})
BaseInput.args = {
  modelValue: undefined,
  label: 'Label example',
  rules: [val => !!val || 'Value required'],
  hint: 'Example hint',
  placeholder: 'Placeholder example',
  testid: 'HInput',
  type: 'text',
  debounce: 0,
  autofocus: false,
  dense: false,
  autogrow: undefined,
  mask: undefined,
  fillMask: undefined,
  color: undefined,
  typeProp: undefined,
  inputFormatting: undefined
}

BaseInput.play = async ({ args, canvasElement }) => {
  const canvas = within(canvasElement)
  const input = canvas.getByTestId('userItem')
  await userEvent.type(input, 'Example', { delay: 10 })
}
