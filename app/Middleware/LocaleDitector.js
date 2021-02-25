'use strict'
const Antl = use('Antl')

class LocaleDitector {
  async handle ({ request }, next) {
    let requestBody = request.all()
    request.requestedLocale = (requestBody.locale) ? requestBody.locale.trim().toLowerCase() : 'en'
    request.requestedLocale = (['en','hi'].includes(request.requestedLocale)) ? request.requestedLocale : 'en'
    request.parrot = Antl.forLocale(request.requestedLocale);
    await next()
  }
}

module.exports = LocaleDitector
