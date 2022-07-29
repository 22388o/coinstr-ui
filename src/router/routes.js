
const routes = [
  {
    // Login
    path: '/login',
    name: 'login',
    component: () => import('pages/Login.vue')
  },
  {
    // Portal Layout
    path: '/',
    component: () => import('layouts/PortalLayout.vue'),
    name: 'root',
    children: [
      // Native Bitcoin Vault layout and routes
      {
        path: 'nbv',
        name: 'nbv',
        component: () => import('layouts/MainLayout.vue'),
        children: [
          // Vaults
          {
            path: '',
            name: 'manageVaults',
            component: () => import('src/pages/nbv/vaults/manage-vaults.vue'),
            meta: {
              breadcrumb: [
                { name: 'My Vaults', icon: 'storage' }
              ],
              app: 'nbv'
            }
          },
          // XPubs
          {
            path: 'xpub',
            name: 'manageXpub',
            component: () => import('pages/nbv/xpub/manage-xpub.vue'),
            meta: {
              breadcrumb: [
                { name: 'Extended Keys', icon: 'key' }
              ],
              app: 'nbv'
            }
          },
          // Vault details
          {
            path: 'vaults/details',
            name: 'vaultDetails',
            props: true,
            component: () => import('pages/nbv/vaults/vault-details.vue'),
            meta: {
              breadcrumb: [
                { name: 'My Vaults', icon: 'storage', to: { name: 'manageVaults' } },
                { name: 'Vault Details', icon: 'summarize' }
              ],
              app: 'nbv'
            }
          },
          // Proposals Details
          {
            path: 'proposal',
            name: 'proposalDetails',
            props: true,
            component: () => import('src/pages/nbv/proposals/proposal-details.vue'),
            meta: {
              breadcrumb: [
                { name: 'My Vaults', icon: 'storage', to: { name: 'manageVaults' } },
                { name: 'Vault Details', icon: 'summarize', back: true },
                { name: 'Proposal Details', icon: 'history_edu' }
              ],
              app: 'nbv'
            }
          }
        ]
      },
      // Marketplaces
      {
        path: 'marketplaces',
        name: 'marketplaceRoot',
        component: () => import('layouts/MainLayout.vue'),
        children: [
          {
            path: '',
            name: 'marketplacesList',
            component: () => import('pages/marketplace/index.vue'),
            meta: {
              breadcrumb: [
                { name: 'Marketplaces', icon: 'storefront' }
              ],
              app: 'marketplaces'
            }
          },
          {
            path: '/marketplaces/details',
            name: 'marketplace-details',
            props: true,
            component: () => import('pages/marketplace/details-market.vue'),
            meta: {
              breadcrumb: [
                { name: 'Marketplaces', icon: 'storefront', to: { name: 'marketplacesList' } },
                { name: 'Detail', icon: 'info' }
              ],
              app: 'marketplaces'
            }
          },
          // Custodian page
          {
            path: '/custody',
            name: 'custodian',
            component: () => import('pages/marketplace/custodian/index.vue'),
            meta: {
              breadcrumb: [
                { name: 'Custodian', icon: 'shield' }
              ],
              app: 'marketplaces'
            }
          },
          {
            path: '/privacy',
            name: 'privacy',
            component: () => import('pages/marketplace/privacy/Index.vue'),
            meta: {
              breadcrumb: [
                { name: 'Privacy', icon: 'home' }
              ],
              app: 'marketplaces'
            }
          }
        ]
      },
      // Sign Test
      {
        path: '/signTest',
        name: 'signTest',
        component: () => import('pages/signTest.vue'),
        meta: {
          app: 'sign'
        }
      },
      // General not accounts page
      {
        path: 'not-accounts',
        name: 'notAccounts',
        component: () => import('pages/NotAccounts.vue'),
        meta: {
          breadcrumb: [
            { name: 'Vaults', icon: 'storage', to: { name: 'manageVaults' } },
            { name: 'Details', icon: 'summarize' }
          ]
        }
      }
    ]
  },
  // {
  //   path: '/examples',
  //   component: () => import('layouts/MainLayout.vue'),
  //   children: [
  //     {
  //       path: 'polkadot',
  //       name: 'polkadot-example',
  //       component: () => import('components/template/polkadot-example.vue'),
  //       meta: {
  //         breadcrumb: [
  //           { name: 'Examples', icon: 'home' }
  //         ]
  //       }
  //     }
  //   ]
  // },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue')
  }
]

export default routes
