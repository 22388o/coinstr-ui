const routes = [
  {
    // COINSTR
    name: 'coinstr',
    path: '',
    component: () => import('layouts/CoinstrLayout.vue'),
    children: [
      {
        name: 'policies',
        path: '',
        component: () => import('pages/coinstr/PoliciesScreen.vue')
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
