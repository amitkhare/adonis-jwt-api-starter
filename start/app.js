'use strict'

/*
|--------------------------------------------------------------------------
| Providers
|--------------------------------------------------------------------------
|
| Providers are building blocks for your Adonis app. Anytime you install
| a new Adonis specific package, chances are you will register the
| provider here.
|
*/
const providers = [
  '@adonisjs/framework/providers/AppProvider',
  '@adonisjs/auth/providers/AuthProvider',
  '@adonisjs/bodyparser/providers/BodyParserProvider',
  '@adonisjs/cors/providers/CorsProvider',
  '@adonisjs/lucid/providers/LucidProvider',
  '@adonisjs/mail/providers/MailProvider',
  '@adonisjs/framework/providers/ViewProvider',
  '@adonisjs/validator/providers/ValidatorProvider',
  '@adonisjs/antl/providers/AntlProvider'
]

/*
|--------------------------------------------------------------------------
| Ace Providers
|--------------------------------------------------------------------------
|
| Ace providers are required only when running ace commands. For example
| Providers for migrations, tests etc.
|
*/
const aceProviders = [
  '@adonisjs/lucid/providers/MigrationsProvider'
]

/*
|--------------------------------------------------------------------------
| Aliases
|--------------------------------------------------------------------------
|
| Aliases are short unique names for IoC container bindings. You are free
| to create your own aliases.
|
| For example:
|   { Route: 'Adonis/Src/Route' }
|
*/
const aliases = {}

// if SENDGRID_API_KEY is set in .env file. this app will use sendgrid api
// otherwise fall back to adonis's native mail service
// unable to use Env.get('SENDGRID_API_KEY'). added dotenv pkg just for this.
// see if Env.get('SENDGRID_API_KEY') can work.
{
  require('dotenv').config()
  const _key = process.env.SENDGRID_API_KEY;
  if(_key != undefined && _key != 'undefined' && _key){
    console.log("sending mails through sendgrid | app.js:60")
    aliases["Mail"] = 'App/Addons/SendGrid';
  } else {
    console.log('SENDGRID_API_KEY not defined in .env, fallback to provider mail | app.js:63')
  }
}
/*
|--------------------------------------------------------------------------
| Commands
|--------------------------------------------------------------------------
|
| Here you store ace commands for your package
|
*/
const commands = []

module.exports = { providers, aceProviders, aliases, commands }
