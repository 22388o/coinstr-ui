const EventKind = {
  METADATA: 0,
  NOTE: 1,
  RELAY: 2,
  CONTACT: 3,
  DM: 4,
  DELETE: 5,
  SHARE: 6,
  REACTION: 7,
  CHANNEL_CREATION: 40,
  CHANNEL_METADATA: 41,
  CHANNEL_HIDE_MESSAGE: 43,
  CHANNEL_MUTE_USER: 44,
  CHATROOM: 42,
  REPORTING: 1984,
  SHARED_KEY: 9288,
  POLICY: 9289,
  SEPNDING_PROPOSAL: 9290,
  APPROVED_PROPOSAL: 9291,
  ZAP_REQUEST: 9734,
  ZAP: 9735,
  RELAY_LIST: 10002,
  AUTHENTICATION: 22242,
  NOSTR_CONNECT: 24133
}

const TagType = {
  PUBKEY: 'p',
  EVENT: 'e'
}

export { EventKind, TagType }
