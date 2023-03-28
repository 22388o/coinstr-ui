import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'

export const useValidations = () => {
  const { t } = useI18n()
  const $store = useStore()
  const rules = reactive({
  // accountExists: async account => !(await this.isAccountFree(account.toLowerCase())) || t('forms.errors.accountNotExists', { account }),
  // accountFormat: val => /^([a-z]|[1-5]|.){1,12}$/.test(val.toLowerCase()) || t('forms.errors.accountFormat'),
  // accountFormatBasic: val => /^([a-z]|[1-5]){12}$/.test(val.toLowerCase()) || t('forms.errors.accountFormatBasic'),
  // accountLength: val => val.length <= 12 || t('forms.errors.accountLength'),
    dateFuture: date => val => new Date(val).getTime() >= new Date(date).getTime() || t('forms.errors.dateFuture'),
    greaterThan: value => val => val > value || t('forms.errors.greaterThan', { value }),
    greaterOrEqualThan: value => val => val >= value || t('forms.errors.greaterOrEqualThan', { value }),
    lessOrEqualThan: value => val => val <= value || t('forms.errors.lessOrEqualThan', { value }),
    containAtLeastCosigners: value => val => val.length >= value || t('forms.errors.containAtLeastCosigners', { value }),
    containLessThanCosigners: value => val => val.length <= value || t('forms.errors.containLessThanCosigners', { value }),
    // isAccountAvailable: async account => (await this.isAccountFree(account.toLowerCase())) || t('forms.errors.accountNotAvailable', { account }),
    isInteger: val => Number.isInteger(parseInt(val)) || t('forms.errors.integer'),
    positiveInteger: val => parseInt(val) > 0 || t('forms.errors.positiveInteger'),
    required: val => !!val || t('forms.errors.required'),
    uploadAtLeastOneDocument: val => val.length > 0 || t('forms.errors.atLeastOneDocument'),
    isValidXPub: val => /([xyYzZtuUvV]pub[1-9A-HJ-NP-Za-km-z]{80,120})/.test(val) || t('forms.errors.isNotValidXpub'),
    isValidFullXpub: val => /(\[[0-Z]{8}\/[0-9]{1,2}(')(\/)[0-9]{1,2}(')\/[0-9]{1,2}(')\/[0-9](')(]){1,30})([xyYzZtuUvsV]pub[1-9A-HJ-NP-Za-km-z]{80,120})/.test(val) || t('forms.errors.isNotValidXpub'),
    isValidFingerPrint: val => /([0-Z]{8,8})/.test(val) || t('forms.errors.isNotValidFingerprint'),
    isValidDerivationPath: val => /([m]\/[0-9]{1,2}(')(\/)[0-9]{1,2}(')\/[0-9]{1,2}(')\/[0-9]('){1,30})/.test(val) || t('forms.errors.isNotValidDerivationPath'),
    isValidMainetBTC: val => /([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[ac-hj-np-zAC-HJ-NP-Z02-9]{11,71})/.test(val) || t('forms.errors.isNotValidMainetBTC'),
    isValidPolkadotAddress: val => $store.$polkadotApi?.isValidPolkadotAddress(val) || t('forms.errors.isNotValidPolkadotAddress'),
    notOwnAccount: value => val => !(value === val) || t('forms.errors.notOwnAccount'),
    isGreaterThanDate: value => val => new Date(val) > new Date(value) || t('forms.errors.isGreaterThanDate', { value }),
    isInflationNumber: val => /^\s?\d*\.?\d*$/.test(val) || t('forms.errors.isInflationNumber', { value: val }),
    isNaicsCode: val => /^\d+((,|\s|,\s)\d+)*$/.test(val) || t('forms.errors.isNaicsCode'),
    isValidRelay: val => /([\w-]+\.)*[\w-]+(\.[\w-]+){1,3}\/?$/.test(val) || t('forms.errors.isValidRelay')
  })

  const validate = async (form) => {
    if (!form) return true
    for await (const key of Object.keys(form)) {
      if (this.$refs[key]) {
        await this.$refs[key].validate()
      }
    }
    return Object.keys(form).reduce((valid, key) => valid && (!this.$refs[key] || !this.$refs[key].hasError), true)
  }
  const resetValidation = (form) => {
    if (!form) return
    Object.keys(form).forEach((key) => this.$refs[key] && this.$refs[key].resetValidation())
  }
  const isInteger = (event) => {
    if (event.keyCode === 46) event.preventDefault()
  }

  return {
    rules,
    validate,
    resetValidation,
    isInteger
  }
}
