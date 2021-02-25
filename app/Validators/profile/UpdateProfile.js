'use strict'

class Authorise {

  get rules () {
    return {
      password: 'required'
    }
  }

  get sanitizationRules() {
    return {
      // it has prblm with dots in email
      // me.amitkhare@gmail.com => meamitkhare@gmail.com
      // email: 'normalize_email'
    }
  }
  
  get data () {
    const requestBody = this.ctx.request.all()
    requestBody.email = (requestBody.email) ? requestBody.email.trim().toLowerCase() : null
    requestBody.username = (requestBody.username) ? requestBody.username.trim().toLowerCase() : null
    return requestBody
  }
  
  get messages () {
    return {
      'password.required': 'Password Required'
    }
  }
  
  async fails (errors) {
    return this.ctx.response.status(400).json({ 
        message: this.ctx.request.parrot.formatMessage('http.request.malformed'),
        errors: errors
    })
  }

}

module.exports = Authorise
