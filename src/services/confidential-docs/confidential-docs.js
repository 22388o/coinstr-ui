// See HashedConfidentialDocs on https://github.com/hashed-io/hashed-confidential-docs-client-api
import {
  HashedConfidentialDocs,
  GoogleDrive,
  Google,
  GoogleVaultAuthProvider,
  Polkadot,
  LocalAccountFaucet,
  BalancesApi
} from '@smontero/hashed-confidential-docs'
// } from '../../../../hashed-confidential-docs-client-api/src/index'
import { Keyring } from '@polkadot/api'

class ConfidentialDocs {
  constructor ({ ipfsURL, chainURI, appName, signer, ipfsAuthHeader }) {
    this._polkadot = new Polkadot({ wss: chainURI, appName })
    this._ipfsURL = ipfsURL
    this._signer = signer
    this._ipfsAuthHeader = ipfsAuthHeader
  }

  async init () {
    await this._polkadot.connect()

    const keyring = new Keyring()
    const faucet = new LocalAccountFaucet({
      balancesApi: new BalancesApi(this._polkadot._api, () => {}),
      signer: keyring.addFromUri(this._signer, {}, 'sr25519'),
      amount: 1000000000
    })

    const hcd = new HashedConfidentialDocs({
      ipfsURL: this._ipfsURL,
      polkadot: this._polkadot,
      faucet,
      ipfsAuthHeader: this._ipfsAuthHeader
    })

    this._hcd = hcd
  }

  getPolkadotApi () {
    return this._polkadot
  }

  async ssoGoogleLogin ({ ssoProvider, ssoUserId, email, clientId }) {
    const googleDrive = new GoogleDrive(new Google({
      // eslint-disable-next-line no-undef
      gapi,
      clientId
    }))

    const vaultAuthProvider = new GoogleVaultAuthProvider({
      authName: ssoProvider,
      userId: ssoUserId,
      email: email,
      googleDrive
    })

    await vaultAuthProvider.init()

    return this._hcd.login(vaultAuthProvider)
  }

  logout () {
    this._hcd.logout()
    this._polkadot.setWallet()
  }

  getPolkadotAddress () {
    return this._hcd.address()
  }

  addOwnedData ({ name, description, payload }) {
    return this._hcd.ownedData().add({
      name,
      description,
      payload
    })
  }

  viewOwnedDataByCID (cid) {
    return this._hcd.ownedData().viewByCID(cid)
  }

  shareData ({ toUserAddress, name, description, payload }) {
    return this._hcd.sharedData().share({
      toUserAddress,
      name,
      description,
      payload
    })
  }

  viewSharedDataByCID (cid) {
    return this._hcd.sharedData().viewByCID(cid)
  }

  getMyDocuments ({ address, subTrigger }) {
    return this._hcd.ownedData().getOwnedDocs(address, subTrigger)
  }

  getMySharedDocuments ({ address, subTrigger }) {
    return this._hcd.sharedData().getSharedDocs(address, subTrigger)
  }

  getSharedWithMeDocuments ({ address, subTrigger }) {
    return this._hcd.sharedData().getSharedWithMeDocs(address, subTrigger)
  }

  removeDoc ({ cid, shared }) {
    if (shared) {
      return this._hcd.sharedData().remove(cid)
    }
    return this._hcd.ownedData().remove(cid)
  }

  updateMetadata ({ cid, name, description, shared }) {
    if (shared) {
      return this._hcd.sharedData().updateMetadata({ cid, name, description })
    }
    return this._hcd.ownedData().updateMetadata({ cid, name, description })
  }
}

export default ConfidentialDocs
