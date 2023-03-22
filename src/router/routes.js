const routes = [
  {
    // Login
    path: '/login',
    name: 'login',
    component: () => import('pages/Login.vue')
  },
  {
    // COINSTR
    name: 'coinstr',
    path: '/coinstr',
    component: () => import('layouts/CoinstrLayout.vue'),
    meta: {
      app: 'coinstr'
    },
    children: [
      {
        name: 'coinstrPolicies',
        path: '',
        component: () => import('pages/coinstr/PoliciesScreen.vue'),
        meta: {
          app: 'coinstr'
        }
      }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue')
  }
]

export default routes
