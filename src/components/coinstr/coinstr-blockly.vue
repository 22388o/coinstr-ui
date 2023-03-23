<template lang='pug'>
#coinstrBlockly
    #blocklyContainer
</template>

<script setup>
import { onMounted, onBeforeUnmount, defineExpose, ref, defineEmits, defineProps, watch, toRef } from 'vue'
import Blockly from 'blockly'
import { javascriptGenerator } from 'blockly/javascript'
import { useNotifications } from '~/composables'

const emits = defineEmits([
  'onChangedPolicy'
])

// const props
const props = defineProps({
  eligiblesKeys: {
    type: Array,
    required: true
  },
  myPublicKey: {
    type: String,
    default: undefined
  }
})

const { handlerError } = useNotifications()

javascriptGenerator.addReservedWords('code')
Blockly.JavaScript = javascriptGenerator

/**
 * @name toolbox
 * @description Return configuration for blockly components
 * @returns {Object}
 */
const toolbox = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Control Flow',
      contents: [
        {
          kind: 'block',
          type: 'and'
        },
        {
          kind: 'block',
          type: 'or'
        },
        {
          kind: 'block',
          type: 'thresh'
        }
      ]
    },
    {
      kind: 'category',
      name: 'Leaves',
      contents: [
        {
          kind: 'block',
          type: 'pk'
        },
        {
          kind: 'block',
          type: 'older'
        },
        {
          kind: 'block',
          type: 'after'
        }
      ]
    },
    {
      kind: 'category',
      name: 'Keys',
      contents: [
        {
          kind: 'block',
          type: 'my_key'
        },
        {
          kind: 'block',
          type: 'key'
        }
      ]
    }
  ]
}

let disableOrphansEvent
let onChangedPolicyEvent
onMounted(() => {
  try {
    loadBlockly()
    const workspace = Blockly.getMainWorkspace()
    disableOrphansEvent = workspace.addChangeListener(Blockly.Events.disableOrphans)
    onChangedPolicyEvent = workspace.addChangeListener(() => {
      const code = generateCode()
      emits('onChangedPolicy', code)
    })
  } catch (e) {
    handlerError(e)
  }
})

onBeforeUnmount(() => {
  try {
    const workspace = Blockly.getMainWorkspace()
    workspace.removeChangeListener(disableOrphansEvent)
    workspace.removeChangeListener(onChangedPolicyEvent)
  } catch (e) {
    console.error('onBeforeUnmount', e)
  }
})

/**
 * @name generateCode
 * @description Generate code to create policy from blockly components
 * @returns {String} code to generate policy
 */
const generateCode = () => {
  const workspace = Blockly.getMainWorkspace()
  return Blockly.JavaScript.workspaceToCode(workspace)
}

// Debugger function
function readTree (beginBlock) {
  const childrenList = {
    blockId: beginBlock.id,
    blockType: beginBlock.type,
    children: readChildren(beginBlock)
  }

  return childrenList
}

// Debugger function
function printTree (node, indentLevel = 0) {
  const indent = '=' + '=='.repeat(indentLevel)
  console.warn(`${indent}${node.blockType}: Id: ${node.blockId} | parentId: ${node.parentId} | nextBlock: ${node.nextBlockId} | parentNext: ${node.parentNextBlockId}`)
  if (node.children.length > 0) {
    node.children.forEach(child => {
      printTree(child, indentLevel + 1)
    })
  }
}

// Define code generation
function defineCodeGeneration () {
  Blockly.JavaScript.INDENT = ''

  Blockly.JavaScript.pk = function (block) {
    if (!block.getParent()) {
      return ''
    }

    let vaulePk = Blockly.JavaScript.valueToCode(block, 'Key', Blockly.JavaScript.ORDER_ATOMIC)
    if (vaulePk === '') {
      vaulePk = '()'
    }

    const code = 'pk' + vaulePk
    return code
  }

  Blockly.JavaScript.begin = function (block) {
    return ''
  }

  Blockly.JavaScript.key = function (block) {
    if (!block.getParent()) {
      return ['', Blockly.JavaScript.ORDER_NONE]
    }

    const textKey = block.getFieldValue('Key')
    const code = textKey
    // TODO: Change ORDER_NONE to the correct strength.
    return [code, Blockly.JavaScript.ORDER_NONE]
  }

  Blockly.JavaScript.my_key = function (block) {
    if (!block.getParent()) {
      return ['', Blockly.JavaScript.ORDER_NONE]
    }

    // TODO: Change ORDER_NONE to the correct strength.
    // return ['_MY_KEY_JUST_TO_TEST', Blockly.JavaScript.ORDER_NONE]
    return [props.myPublicKey, Blockly.JavaScript.ORDER_NONE]
  }

  Blockly.JavaScript.thresh = function (block) {
    const numberThreshold = block.getFieldValue('Threshold')
    let code = 'thresh(' + numberThreshold + ','
    let child = block.getChildren(true)[0]
    while (child) {
      code += Blockly.JavaScript[child.type](child)
      child = child.getNextBlock()
      if (child) {
        code += ','
      }
    }
    code += ')'
    return code
  }

  Blockly.JavaScript.older = function (block) {
    if (!block.getParent()) {
      return ''
    }

    const numberName = block.getFieldValue('value')
    const code = 'older(' + numberName + ')'
    return code
  }

  Blockly.JavaScript.after = function (block) {
    if (!block.getParent()) {
      return ''
    }

    const numberName = block.getFieldValue('value')
    // TODO: Assemble JavaScript into code variable.
    const code = 'after(' + numberName + ')'
    return code
  }

  Blockly.JavaScript.and = function (block) {
    if (!block.getParent()) {
      return ''
    }

    const statementsA = Blockly.JavaScript.statementToCode(block, 'A')
    const statementsB = Blockly.JavaScript.statementToCode(block, 'B')
    const code = 'and(' + statementsA + ',' + statementsB + ')'
    return code
  }

  Blockly.JavaScript.or = function (block) {
    if (!block.getParent()) {
      return ''
    }

    let numberAWeight = block.getFieldValue('A_weight')
    if (numberAWeight === '1' || numberAWeight === 1) {
      numberAWeight = ''
    } else {
      numberAWeight = numberAWeight + '@'
    }
    const statementsA = Blockly.JavaScript.statementToCode(block, 'A')
    let numberBWeight = block.getFieldValue('B_weight')
    if (numberBWeight === '1' || numberBWeight === 1) {
      numberBWeight = ''
    } else {
      numberBWeight = numberBWeight + '@'
    }
    const statementsB = Blockly.JavaScript.statementToCode(block, 'B')
    const code = 'or(' + numberAWeight + statementsA + ',' + numberBWeight + statementsB + ')'
    return code
  }
}

// Debugger function
function readChildren (block, parentBlock) {
  const children = block.getChildren()
  const childrenList = []
  if (children) {
    children.forEach(child => {
      const parentBlockId = child.parentBlock_?.id
      // const workspace = Blockly.getMainWorkspace()
      // const parentBlock = workspace.getBlockById(parentBlockId)
      const parentNextBlockId = parentBlock?.nextBlockId
      const childData = {
        blockId: child.id,
        parentId: parentBlockId,
        blockType: child.type,
        nextBlockId: child.getNextBlock()?.id,
        value: child.getFieldValue('VALUE'),
        parentNextBlockId,
        children: []
      }
      childData.children = childData.children.concat(readChildren(child, childData))
      const workspace = Blockly.getMainWorkspace()
      if (childData.nextBlockId !== undefined) {
        // debugger
        const nextBlock = workspace.getBlockById(childData.nextBlockId)
        const nextData = {
          blockId: nextBlock.id,
          parentId: parentBlockId,
          blockType: nextBlock.type,
          nextBlockId: nextBlock.getNextBlock()?.id,
          value: nextBlock.getFieldValue('VALUE'),
          parentNextBlockId,
          children: []
        }
        // debugger
        nextData.children = readChildren(nextBlock, parentBlock)
        // const newChildren = parentBlock.children.concat([nextData])
        // parentBlock.children = newChildren
        childrenList.push(nextData)
        // childData.children = readChildren(nextBlock, parentBlock)
      }
      // if (block.type === 'pk') debugger
      if (childData.blockId !== parentNextBlockId) {
        childrenList.push(childData)
      }
    })
  }
  return childrenList
}

// Load Blockly component
const loadBlockly = () => {
  Blockly.Blocks.text.newQuote_ = function () {
    return this.SINGLE_QUOTE ? Blockly.Msg.TEXT_APPEND_VARIABLE : Blockly.Msg.TEXT_APPEND_TEXT
  }

  // Register allow_chain_in_thresh extension
  try {
    Blockly.Extensions.register(
      'allow_chain_in_thresh',
      function () {
        const thisBlock = this
        this.setOnChange(function (changeEvent) {
          let parent = thisBlock.getSurroundParent()
          if (changeEvent.type === 'create') {
            if (!parent || parent.type !== 'thresh') {
              thisBlock.setNextStatement(true, 'AAAA')
            }
          }
          if (changeEvent.blockId !== thisBlock.id || changeEvent.type !== 'move') {
            return
          }
          parent = thisBlock.getSurroundParent()
          if (changeEvent.newParentId && parent && parent.type === 'thresh') {
            thisBlock.setNextStatement(true, 'Policy')
          } else {
            if (thisBlock.nextConnection && thisBlock.nextConnection.isConnected()) {
              thisBlock.nextConnection.disconnect()
            }
            // if (thisBlock.previousConnection && thisBlock.previousConnection.isConnected()) {
            //     thisBlock.previousConnection.disconnect()
            // }
            thisBlock.setNextStatement(true, 'AAAA')
          }
        })
      }
    )
  } catch (e) {
    console.warn(e)
  }

  // Set AND custom block
  Blockly.Blocks.and = {
    init: function () {
      this.setColour(230)
      this.appendStatementInput('A')
        .setCheck('Policy')
      this.appendDummyInput()
        .appendField('AND')
      this.appendStatementInput('B')
        .setCheck('Policy')
      this.setInputsInline(false)
      this.setPreviousStatement(true, 'Policy')
      this.setNextStatement(true, 'Policy')
      this.setTooltip('Requires both sub-policies to be satisfied')
    }
  }

  // Set OR custom block
  Blockly.Blocks.or = {
    init: function () {
      this.setColour(230)
      this.appendDummyInput()
        .appendField('Weight')
        .appendField(new Blockly.FieldNumber(1, 0, Infinity, 1), 'A_weight')
        .appendField(this.newQuote_())
        .appendField(new Blockly.FieldLabelSerializable(' '), 'SPACE')
      this.appendStatementInput('A')
        .setCheck('Policy')
      this.appendDummyInput()
        .appendField('OR')
      this.appendDummyInput()
        .appendField('Weight')
        .appendField(new Blockly.FieldNumber(1, 0, Infinity, 1), 'B_weight')
        .appendField(this.newQuote_())
        .appendField(new Blockly.FieldLabelSerializable(' '), 'SPACE')
      this.appendStatementInput('B')
        .setCheck('Policy')
      this.setPreviousStatement(true, 'Policy')
      this.setNextStatement(true, 'Policy')
      this.setInputsInline(false)
      this.setTooltip('Requires either one of the two sub-policies to be satisfied. Weights can be used to indicate the relative probability of each sub-policy')
    },
    newQuote_: Blockly.Blocks.text.newQuote_
  }

  // Set TRESH custom block
  Blockly.Blocks.thresh = {
    init: function () {
      this.setColour(230)
      this.appendDummyInput()
        .appendField('Threshold')
        .appendField(new Blockly.FieldNumber(1, 1, Infinity, 1), 'Threshold')
        .appendField(this.newQuote_())
        .appendField(new Blockly.FieldLabelSerializable(' '), 'SPACE')
      this.appendStatementInput('Statements')
        .setCheck('Policy')
      this.setPreviousStatement(true, 'Policy')
      this.setNextStatement(true, 'Policy')
      this.setInputsInline(false)
      this.setTooltip("Creates a threshold element (m-of-n), where the 'm' field is manually set and 'n' is implied by the number of sub-policies added")
    },
    newQuote_: Blockly.Blocks.text.newQuote_
  }

  // Set BEGIN custom block
  Blockly.Blocks.begin = {
    init: function () {
      this.singleton = true
      this.startHat = true
      this.hat = true
      this.setColour(160)
      this.appendDummyInput()
        .appendField('Begin')
        .appendField(this.newQuote_())
        .appendField(new Blockly.FieldLabelSerializable(' '), 'SPACE')
      this.setDeletable(false)
      this.setEditable(false)
      this.setPreviousStatement(false)
      this.setNextStatement(true, 'Policy')
      this.setInputsInline(false)
      this.setTooltip('Sets the beginning of the policy')
    },
    startHat: true,
    newQuote_: Blockly.Blocks.text.newQuote_
  }

  // Set MY_KEY custom block
  Blockly.Blocks.my_key = {
    init: function () {
      this.appendDummyInput()
        .appendField('My Key')
      this.setOutput(true, 'Key')
      this.setColour(22)
      this.setTooltip('My private key')
      this.setInputsInline(false)
    }
  }

  // Set KEY custom block
  Blockly.Blocks.key = {
    init: function () {
      this.appendDummyInput()
        .appendField('')
        .appendField(new Blockly.FieldDropdown(this.generateOptions), 'Key')
      this.setOutput(true, 'Key')
      this.setInputsInline(false)
      this.setNextStatement(false)
      this.setColour(65)
      this.setTooltip('')
      this.setHelpUrl('')
      // Blockly.Extensions.apply('dynamic_options', this)
    },
    generateOptions: function () {
      if (!props.eligiblesKeys || !props.eligiblesKeys.length === 0) return [['Please add contacts to policy', '']]
      const newOptions = props.eligiblesKeys?.map(option => {
        const label = option.display_name || option.name
        const pk = option.bitcoinAddress || ''
        return [label, pk]
      })
      if (newOptions.length >= 1) return newOptions
      return [['Please add a contact to policy', '']]
    }
  }

  // Set PK custom block
  Blockly.Blocks.pk = {
    init: function () {
      this.appendValueInput('Key')
        .setCheck('Key')
        .appendField('Key')
      this.setPreviousStatement(true, 'Policy')
      this.setNextStatement(true, 'Policy')
      this.setColour(120)
      this.setTooltip('Require a signature from a given key to satisfy this fragment')
      this.setInputsInline(false)
      // this.extensions = ['allow_chain_in_thresh']
      Blockly.Extensions.apply('allow_chain_in_thresh', this)
    }
  }

  // Set OLDER custom block
  Blockly.Blocks.older = {
    init: function () {
      this.appendDummyInput()
        .appendField('Older')
        .appendField(new Blockly.FieldNumber(6), 'value')
      this.setPreviousStatement(true, 'Policy')
      this.setNextStatement(true, 'Policy')
      this.setColour(150)
      this.setTooltip('Add a relative timelock expressed in number of blocks')
      this.setHelpUrl('')
      // this.extensions = ['allow_chain_in_thresh']
      Blockly.Extensions.apply('allow_chain_in_thresh', this)
    }
  }

  // Set AFTER custom block
  Blockly.Blocks.after = {
    init: function () {
      this.appendDummyInput()
        .appendField('After')
        .appendField(new Blockly.FieldNumber(10000), 'value')
      this.setPreviousStatement(true, 'Policy')
      this.setNextStatement(true, 'Policy')
      this.setColour(150)
      this.setTooltip('Add a relative timelock expressed in absolute block height')
      this.setHelpUrl('')
      // this.extensions = ['allow_chain_in_thresh']
      Blockly.Extensions.apply('allow_chain_in_thresh', this)
    }
  }

  // Call define code generation
  defineCodeGeneration()

  // Inject blockly settings on DOM
  Blockly.inject('blocklyContainer', { toolbox })
  console.warn('Blockly was injected')

  // Set in workspace begin block
  const xmlText = '<xml><block type="begin"></block></xml>'
  const xml = Blockly.Xml.textToDom(xmlText)
  const workspace = Blockly.getMainWorkspace()
  Blockly.Xml.appendDomToWorkspace(xml, workspace)
  const block = workspace.getAllBlocks()
  block[0].moveBy(250, 0)
}

// - Expose generateCode function
defineExpose({
  generateCode
})
// -
</script>

<style lang="stylus" scoped>
#blocklyContainer
  width: 100%
  height: 80vh
</style>
