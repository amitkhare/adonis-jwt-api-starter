'use strict'

class UpdatePassword {

  get rules () {
    return {
      password: 'required',
      password_new: 'required|min:6'
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
    return requestBody
  }
  
  get messages () {
    return {
      'password.required': 'Password Required',
      'password_new.required': 'Password Required',
      'password_new.min': 'Password needs to be at least 6 characters long.'
    }
  }
  
  async fails (errors) {
    return this.ctx.response.status(400).json({ 
        message: this.ctx.request.parrot.formatMessage('http.request.malformed'),
        errors: errors
    })
  }

}

module.exports = UpdatePassword
