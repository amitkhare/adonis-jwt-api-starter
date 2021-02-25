'use strict'

class Authorise {

  get rules () {
    return {
      // avatar: 'required'
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
      'avatar.required': 'Avatar address can\'t be empty.',
      'avatar.file': 'Avatar address is not valid'
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
