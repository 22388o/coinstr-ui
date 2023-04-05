/* eslint-disable storybook/prefer-pascal-case */
// import { expect } from '@storybook/jest'
import UserItem from '~/components/coinstr/user-item.vue'
import { within, userEvent } from '@storybook/testing-library'
import { ref } from 'vue'
import { expect } from '@storybook/jest'
// import { expect } from '@storybook/jest'
export default {
  title: 'Users/UserItem',
  component: UserItem,
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
  components: { UserItem },
  // The story's `args` need to be mapped into the template through the `setup()` method
  setup () {
    // Story args can be spread into the returned object
    const data = ref(undefined)
    const isSelectable = ref(false)
    return { args, data }
  },
  // Then, the spread values can be accessed directly in the template
  template: '<UserItem v-bind="args" @onAddUser="args.onAddUser" @onRemoveUser="args.onRemoveUser"/>'
})

export const base = Template.bind({})
const user = {
  about: 'Water well',
  name: 'Amanda',
  nip05: 'amanda@waterwell.ngo',
  npub: 'npub1phvpqfd8hq7x7set0tlpty2p0fq8fvhxfwvzfxg2fatsn66kvvsq2tag8v',
  picture: 'https://waterwell.ngo/profiles/amanda.png',
  banner: 'https://nostr.build/i/nostr.build_e34050e635c540aa737baef0ae9637b90469b8b5c7102209e95de6eb32e4b7a1.jpeg',
  lud06: 'lnbc1pjpr7k2pp5p8u3h6a9k8r0gffrt8t3zd2s7glmqg262wlvlsyfj8p73tdztl4qdqqcqzzgxqyz5vqrzjqwnvuc0u4txn35cafc7w94gxvq5p3cu9dd95f7hlrh0fvs46wpvhdldjcfs3eg3jr5qqqqryqqqqthqqpyrzjqw8c7yfutqqy3kz8662fxutjvef7q2ujsxtt45csu0k688lkzu3ldldjcfs3eg3jr5qqqqryqqqqthqqpysp5y9uwpnqspjmxpngwull43q5rnktuvaq0etpth0kzpsnmeg3r48lq9qypqsqu0wyhfvz0p5nnqqawh84pppw75w4r2w9uu9av4pvwech6n7zygnxd5jxd2m0l2ru8qq8e9tnhxdva36xevv8nlhgtt6t830rngqk3pqqgkv0uh',
  isSelectable: false
}

base.args = {
  user
}

base.play = async ({ args, canvasElement }) => {
  const canvas = within(canvasElement)
  const userItem = canvas.getByTestId('userItem')
  const name = canvas.getByText(user.name)
  const _npub = user.npub.substring(4, 9) + '...' + user.npub.substring(user.npub.length - 5)
  const npub = canvas.getByText(_npub)
  await expect(userItem).toBeInTheDocument()
  await expect(name).toBeInTheDocument()
  await expect(npub).toBeInTheDocument()
}

export const interactive = Template.bind({})
interactive.args = {
  user,
  interactive: true
}
interactive.play = async ({ args, canvasElement }) => {
  const canvas = within(canvasElement)
  const userItem = canvas.getByTestId('userItem')
  const name = canvas.getByText(user.name)
  const _npub = user.npub.substring(4, 9) + '...' + user.npub.substring(user.npub.length - 5)
  const npub = canvas.getByText(_npub)
  const button = canvas.getByTestId('interactWithPolicyBtn')

  await expect(userItem).toBeInTheDocument()
  await expect(name).toBeInTheDocument()
  await expect(npub).toBeInTheDocument()
  await expect(button).toBeInTheDocument()
  await expect(button).toHaveTextContent('Add to Policy')
  await userEvent.click(button)
  await expect(args.onAddUser).toHaveBeenCalledTimes(1)
  // args.user.isSelectable = true
  // await expect(button).toHaveTextContent('Added')
}
