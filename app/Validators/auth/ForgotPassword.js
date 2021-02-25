'use strict'

class ForgotPassword {

  get rules () {
    return {
      email: 'required|email'
    }
  }
  
  get data () {
    const requestBody = this.ctx.request.all()
    requestBody.email = (requestBody.email) ? requestBody.email.trim().toLowerCase() : null
    return requestBody
  }
  
  async fails (errors) {
    return this.ctx.response.status(400).json({ 
        message: this.ctx.request.parrot.formatMessage('http.request.malformed'),
        errors: errors
    })
  }
  
  get messages () {
    return {
      'email.required': 'Email is required',
      'email.email': 'Enter a valid email address'
    }
  }

}

module.exports = ForgotPassword
