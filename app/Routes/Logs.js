'use strict'

const Route = use('Route')

module.exports = () => {
  Route.get('/', 'LogController.index')
  Route.get('/remove/:id', 'LogController.remove').middleware('jwtAuthSuperAdmin')
  Route.get('/clear/all', 'LogController.clearAll').middleware('jwtAuthSuperAdmin')
}


  