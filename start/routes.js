'use strict'

const Route = use('Route')

Route.group(use('App/Routes/Auth')).prefix('/auth')
Route.group(use('App/Routes/Profile')).prefix('/profile')
Route.group(use('App/Routes/Logs')).prefix('/logs').middleware('jwtAuth')

Route.any('/', ({ request, response, locale }) => {
  return response.status(200).json({
    greeting: request.parrot.formatMessage('alerts.greeting'),
    currency: request.parrot.formatAmount(100, 'inr'),
    day: request.parrot.formatDate(new Date(), { weekday: 'long' }),
    requestedLocale: request.requestedLocale
  })
}).as('home')


// 404 page not found
Route.any('*', ({ request, response }) => {
    return response.status(404).json({
      message: request.parrot.formatMessage('http.resource.not.found')
    })
    //return response.status(404).send( view.render('notify', { message: 'Page Not Found', type: 'danger' }) ) 
})


