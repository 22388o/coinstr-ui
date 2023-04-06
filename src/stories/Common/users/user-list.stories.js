/* eslint-disable storybook/prefer-pascal-case */
// import { expect } from '@storybook/jest'
import UsersList from '~/components/users/users-list.vue'
import { within, userEvent } from '@storybook/testing-library'
import { ref } from 'vue'
import { expect } from '@storybook/jest'
// import { expect } from '@storybook/jest'
export default {
  title: 'Users/UserList',
  component: UsersList,
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

const sleep = (ms) => new Promise(resolve => { setTimeout(resolve(), ms) })
const Template = (args) => ({
  // Components used in your story `template` are defined in the `components` object
  components: { UsersList },
  // The story's `args` need to be mapped into the template through the `setup()` method
  setup () {
    // Story args can be spread into the returned object
    const data = ref([{
      about: 'Vice Chairperson, Water Well',
      banner: 'https://coinstr.app/coinstr.png',
      display_name: 'John Chen',
      name: 'john',
      nip05: 'john@waterwell.ngo',
      picture: 'https://img.freepik.com/premium-vector/profile-icon-male-avatar-hipster-man-wear-headphones_48369-8728.jpg',
      npub: 'npub1zq08j5a9fvvdpaq75xvmnt0j6lnyx3qmttuw2w2nrekhyawwu80s7tz8rm',
      bitcoinAddress: '101e7953a54b18d0f41ea199b9adf2d7e643441b5af8e539531e6d7275cee1df'
    }, {
      about: 'Board Member, Water Well',
      banner: 'https://coinstr.app/coinstr.png',
      display_name: 'Dr Karen Patel',
      name: 'karen',
      nip05: 'karen@waterwell.ngo',
      picture: 'https://waterwell.ngo/profiles/karen.png',
      npub: 'npub1gxlgqsjdlwdn84nw5n6nd8xxky904gdsk9n667upzt7ksj865vhq8em57x',
      bitcoinAddress: '41be80424dfb9b33d66ea4f5369cc6b10afaa1b0b167ad7b8112fd6848faa32e'
    }, {
      about: 'Waterwell Board and Family Man',
      banner: 'https://coinstr.app/coinstr.png',
      display_name: 'Trey Smith',
      name: 'trey',
      nip05: 'trey@waterwell.ngo',
      picture: 'https://image.shutterstock.com/image-photo/stock-photo-head-shot-young-attractive-businessman-in-glasses-standing-in-modern-office-pose-for-camera-250nw-1854697390.jpg',
      npub: 'npub1287hxjzvgdfc3d9zw65xk7ng3rvrcp6wj93puyrnduul8hrh9p8sk37cpe',
      bitcoinAddress: '51fd73484c435388b4a276a86b7a6888d83c074e91621e10736f39f3dc77284f'
    }])
    const search = ref(undefined)
    return { args, data, search }
  },
  // Then, the spread values can be accessed directly in the template
  template: '<UsersList v-model="data" v-bind="args" @onAddUser="args.onAddUser" @onRemoveUser="args.onRemoveUser"/>'
})

export const base = Template.bind({})
base.args = {}
base.play = async ({ args, canvasElement }) => {
  const canvas = within(canvasElement)
  const list = canvas.getByTestId('UsersListWrapper')
  await expect(list).toBeInTheDocument()
  const users = canvas.getAllByRole('userItem')
  await expect(users.length).toEqual(3)
  const buttons = canvas.getAllByTestId('interactWithPolicyBtn')
  await expect(buttons[0]).toHaveTextContent('Add to Policy')
  await userEvent.click(buttons[0])
  await expect(buttons[0]).toHaveTextContent('Added')
  await expect(buttons[1]).toHaveTextContent('Add to Policy')
  await expect(buttons[2]).toHaveTextContent('Add to Policy')
}

export const searchable = Template.bind({})
searchable.args = {
  search: 'John'
}
searchable.play = async ({ args, canvasElement }) => {
  const canvas = within(canvasElement)
  const list = canvas.getByTestId('UsersListWrapper')
  await expect(list).toBeInTheDocument()
  const users = canvas.getAllByRole('userItem')
  await expect(users.length).toEqual(1)
  const buttons = canvas.getAllByTestId('interactWithPolicyBtn')
  await expect(buttons[0]).toHaveTextContent('Add to Policy')
  await userEvent.click(buttons[0])
  await expect(buttons[0]).toHaveTextContent('Added')
}

export const loading = Template.bind({})
loading.args = {
  loading: true
}
loading.play = async ({ args, canvasElement }) => {
  const canvas = within(canvasElement)
  const list = canvas.getByTestId('UsersListWrapper')
  await expect(list).toBeInTheDocument()
  const skeleton = canvas.getByTestId('UsersListSkeleton')
  await expect(skeleton).toBeInTheDocument()
}
