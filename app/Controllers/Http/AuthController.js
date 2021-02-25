'use strict'
const Hash = use('Hash')
const Env = use('Env')
const Mail = use('Mail')
const uuid = use('uuid/v1')
const User = use('App/Models/User')
const { validate } = use('Validator')
const logger = use('App/Helpers/Logger')

const AppName  = Env.get('APP_NAME', 'Khare\'s app')
const AppEmail = Env.get('MAIL_FROM_EMAIL', 'gatekeeper@example.com')

class AuthController {
  // POST
  async authorise({ request, response, auth }) {
    const { email, password } = request.all()
    try {
      const result = await auth.withRefreshToken().attempt(email, password)
      const user = await User.findBy('email', email)
      if(user.banned) {
        // revoke all tokens
        await auth.scheme('jwt').revokeTokens()
        return response.status(401).json({ message: request.parrot.formatMessage('auth.user.banned')})
      }
      await logger('info','User Login', user.id, null, email)
      return response.status(200).json({...result, message: request.parrot.formatMessage('auth.user.login.success') })
    }
    catch (errors) {
      console.log(errors)
      errors.email = email
      await logger('error','User Login: Failed', null, null, errors)
      return response.status(401).json({
        message: request.parrot.formatMessage('auth.user.cant.authorise')
      })
    }
  }
  // POST
  async signup({ request, response, auth }) {
    
    const { username, email, password } = request.all()
    const user = new User()
    user.username = username
    user.email = email
    user.password = password
    const res = await user.save()
    if (res) {
      await Mail.send('emails.welcome', { token: (user.confirmation_token) ? user.confirmation_token : "verified" }, (message) => {
        message.from(AppEmail)
        message.subject(`Welcome to ${AppName}`)
        message.to(user.email)
      })
      const result = await auth.withRefreshToken().generate(user)
      await logger('info','User Signup', user.id, user.id, user.email)

      return response.status(201).json({...result, message: request.parrot.formatMessage('auth.user.signup.success') })
    }
    
    return response.status(500).json({
      message: request.parrot.formatMessage('auth.something.went.wrong')
    })
  }
  // POST
  async updatePassword({ request, response, auth }) {

    const { password, password_new } = request.all()
    const user = auth.user
    const passwordValid = await Hash.verify(password, user.password);
    if(!passwordValid) {
      return response.status(400).json({ message: request.parrot.formatMessage('auth.invalid.current.password')})
    }
    
    user.password = await Hash.make(password_new)
    user.reset_token = null
    const result = await user.save()

    if (result) {
      await Mail.send('emails.update-password', { rawPassword: password_new }, (message) => {
        message.from(AppEmail)
        message.subject(`${AppName} Passoword Update`)
        message.to(user.email)
      })
      await logger('info','Password Updated', user.id, user.id, user.email)
      return response.status(201).json({ message: request.parrot.formatMessage('auth.password.updated')}, result)
    }
    
    return response.status(500).json({
      message: request.parrot.formatMessage('auth.something.went.wrong'),
    })
  }
  // POST
  async updateEmail({ request, response, auth }) {

    const { email, password } = request.all()
    const user = auth.user
    const passwordValid = await Hash.verify(password, user.password);
    if(!passwordValid) {
      return response.status(400).json({ message: request.parrot.formatMessage('auth.invalid.current.password')})
    }
    
    const hasUser = await User.findBy('email', email)
    
    if(hasUser && hasUser.email !== user.email) {
      return response.status(400).json({ message: request.parrot.formatMessage('auth.email.exists')})
    }
    
    user.email = email
    user.confirmation_token = uuid()
    user.verified = false
    const res = await user.save()

    if (res) {
      await Mail.send('emails.update-email', { token: user.confirmation_token }, (message) => {
        message.from(AppEmail)
        message.subject(`${AppName} Email Update`)
        message.to(user.email)
      })
      await logger('info','Email Updated', user.id, user.id, user.email)
      return response.status(200).json({ message: request.parrot.formatMessage('auth.email.updated')}, user)
    }
    
    return response.status(500).json({
      message: request.parrot.formatMessage('auth.something.went.wrong'),
    })
  }
  // POST
  async resendEmailVerificationCode ({ request, response }) {

    const data = request.only(['email'])
    // find or fail user by email
    const user = await User.findBy('email', data.email )
    if ( !user ) {
      return response.status(400).json({ message: 'Wrong email.' })
    }

    // check if already verified
    if ( !user.confirmation_token ) {
      return response.status(422).json({ message: request.parrot.formatMessage('auth.email.already.verified') })
    }

    // resend verification
    await Mail.send('emails.welcome', { token: user.confirmation_token }, (message) => {
      message.from(AppEmail)
      message.subject('Verification email')
      message.to( user.email )
    })

    // send response
    await logger('info','User Email Verify Link Sent', user.id, user.id, user.email)
    return response.status(200).json({ message: request.parrot.formatMessage('auth.verification.email.sent') })
    
  }
  // GET
  async confirmEmail({ request, response, params }) {
    const token = params.token
    const user = await User.findBy('confirmation_token', token)

    // if user exists
    if (user) {
      user.confirmation_token = null
      user.verified = true
      await user.save()
      await logger('info','User Email Verified', user.id, user.id, user.email)
      return response.status(200).json({
        message: request.parrot.formatMessage('auth.email.verified'),
      })
    }

    return response.status(404).json({
      message: request.parrot.formatMessage('auth.invalid.verification.code'),
    })

  }
  // GET
  async toggleUserBan({ request, response, params, auth }) {
    const id = params.id
    const user = await User.find(id)
    
    if (!user) {
      return response.status(404).json({ message: request.parrot.formatMessage('auth.user.not.found') })
    }
    
    const admin = await auth.getUser()
    if(admin.id === user.id){
      return response.status(400).json({ message : request.parrot.formatMessage('auth.cant.ban.yourself') })
    }
    
    if(user.role === User.roles[0]){
      return response.status(400).json({ message : request.parrot.formatMessage('auth.cant.be.banned', { role: User.roles[0] }) })
    }

    user.banned = !user.banned
    const result = await user.save()
    
    if (result){
      await logger('info','User Banned: ' + user.banned, admin.id, user.id, user.email)
      return response.status(200).json({
        message: request.parrot.formatMessage('auth.user.now.banned', { id: user.banned }),
      })
    }
    
    return response.status(500).json({
      message: request.parrot.formatMessage('auth.something.went.wrong'),
    })

  }
  // GET
  async removeUser({ request, response, params, auth }) {
    const id = params.id
    const user = await User.find(id)
    
    if (!user) {
      return response.status(404).json({ message: request.parrot.formatMessage('auth.user.not.found') })
    }
    
    const admin = await auth.getUser()
    if(admin.id === user.id){
      return response.status(400).json({ message : request.parrot.formatMessage('auth.cant.remove.yourself') })
    }
    
    if(user.role === User.roles[0]){
      return response.status(400).json({ message : request.parrot.formatMessage('auth.cant.be.removed', { role: User.roles[0] }) })
    }

    const result = await user.delete()
    
    if (result){
      await logger('info','User Removed', admin.id, user.id, user)
      return response.status(200).json({
        message: request.parrot.formatMessage('auth.user.removed', { email: user.email }),
      })
    }
    
    return response.status(500).json({
      message: request.parrot.formatMessage('auth.something.went.wrong'),
    })

  }
  // POST
  async forgotPassword ({ request, response }) {

    const data = request.only(['email'])

    // find or fail user by email
    const user = await User.findBy('email', data.email )
    if ( !user ) {
      return response.status(400).json({ message: request.parrot.formatMessage('auth.wrong.email') })
    }

    // add reset token to user
    user.reset_token = uuid()
    await user.save()

    // resend verification
    await Mail.send('emails.forgot', { token: user.reset_token }, (message) => {
      message.from(AppEmail)
      message.subject('Reset password')
      message.to( user.email )
    })

    // send response
    await logger('info','User Forgot Passoword', user.id, user.id, 'Reset password email has been sent to ' + user.email)
    return response.status(200).json({ message: request.parrot.formatMessage('auth.reset.password.email.sent', { email: user.email }) })
  }
  
  // POST
  async resetPassword({ request, response }) {

    const data = request.only(['token', 'password'])

    // find or fail user by reset token
    const user = await User.findBy('reset_token', data.token)
    if (!user) {
      return response.status(400).json({ message: request.parrot.formatMessage('auth.invalid.reset.code') })
    }

    // add new password to user
    user.password = await Hash.make(data.password)
    user.reset_token = null
    const result = await user.save()
    
    if (result) {
      await Mail.send('emails.reset-password', { rawPassword: data.password }, (message) => {
        message.from(AppEmail)
        message.subject(`${AppName} Passoword Update`)
        message.to(user.email)
      })
      await logger('info', 'User Passoword Reset', user.id, user.id, 'Password has been changed for ' + user.email)
      return response.status(201).json({ message: request.parrot.formatMessage('auth.password.updated')}, result)
    }
    

    return response.status(200).json({ message: request.parrot.formatMessage('auth.password.changed') })
  }
  
  // POST
  async refreshToken({ request, response, auth }) {
    const refreshToken = request.input('refresh_token')
    const result = await auth.newRefreshToken().generateForRefreshToken(refreshToken)
    return response.status(200).json(result)
  }
  // GET
  async revokeToken({ request, response, auth }) {
    const { refreshToken, isRevokeAll, isRemove } = request.all()

    if (isRevokeAll) {
      const result = await auth.authenticator('jwt').revokeTokens()
      return response.status(200).json(result)
    }
    if (refreshToken && refreshToken.length > 10 && isRemove) {
      const result = await auth.authenticator('jwt').revokeTokens([refreshToken], true)
      return response.status(200).json(result)
    }
    
    if (refreshToken && refreshToken.length > 10) {
      const result = await auth.authenticator('jwt').revokeTokens([refreshToken])
      return response.status(200).json(result)
    }
    
    return response.status(400).json({ message: request.parrot.formatMessage('auth.invalid.missing.refresh.token') })
  }
  
  // GET
  async myTokens({ request, response, auth }) {
    const tokens = await auth.listTokens()
    return response.status(200).json(tokens)
  }
  // GET
  async me({ request, response, auth }) {
    var user = await auth.getUser()
    user.profile = await user.profile().fetch()
    return response.status(200).json(user)
  }
  // GET
  async users({ request, response, auth }) {
      const page = (request.all().page && !isNaN(parseInt(request.all().page))) ? parseInt(request.all().page) : 1

      var result = await User.query().paginate(page)
      
      result = result.toJSON()

      result.data = await Promise.all(result.data.map(async (el) => {
          let usr = await User.find(el.id)
          let profile = await usr.profile().first()
          el.profile = profile
          return el
      }));

      return response.status(200).json(result)
  }
  // POST Assign auth level to user
  async assignRole({ request, response, auth }) {
    const admin = await auth.getUser()
    const { userId, role } = request.only(["userId", "role"])
    
    if(!role || !User.roles.includes(role)){
      return response.status(400).json({ message : request.parrot.formatMessage('auth.invalid.role'), roles: User.roles })
    }
    
    const user = await User.find(userId)

    if(!user) {
      return response.status(400).json({ message : request.parrot.formatMessage('auth.invalid.user.id') })
    }
    
    if(admin.id === user.id){
      return response.status(400).json({ message : request.parrot.formatMessage('auth.cant.assign.role.yourself') })
    }
    
    if(user.role === role) {
      return response.status(400).json({ message : request.parrot.formatMessage('auth.role.already.assigned') })
    }
    
    user.role = role

    const result = await user.save()

    if (result) {
      await Mail.send('emails.role-assign', { user }, (message) => {
        message.from(AppEmail)
        message.subject('Role assigned')
        message.to(user.email)
      })
      await logger('info','User Role assign', user.id, admin.id, user.role)
      return response.status(200).json({ message: request.parrot.formatMessage('auth.user.role.assigned', {role: user.role}) })
    }
    
    return response.status(500).json({ message: request.parrot.formatMessage('auth.something.went.wrong') })
  }
  
  /*  #######  Pages with view  ######### */
  // GET
  async confirmEmailRender({ request, response, params, view }) {
    const token = params.token
    const user = await User.findBy('confirmation_token', token)

    // if user exists
    if (user) {
      user.confirmation_token = null
      user.verified = true
      await user.save()
      await logger('info','User Email Verified', user.id, user.id, user.email)
      return view.render('notify', { type:'info', message: request.parrot.formatMessage('auth.email.now.verified') })
    }

    return view.render('notify', { type:'warning', message: request.parrot.formatMessage('auth.invalid.email.verification.code')})
  }
  // GET
  async resetPasswordForm({ request, response, params, view }) {
     const token = params.token

    // find or fail user by reset token
    const user = await User.findBy('reset_token', token )
    if ( !user ) {
      return view.render('notify', { type:'warning', message: request.parrot.formatMessage('auth.invalid.reset.code') })
    }
    return view.render('auth.reset', { token: token })
  }
  
}

module.exports = AuthController
