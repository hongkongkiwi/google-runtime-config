const CloudConfig = require('./index')

let config = new CloudConfig()
config.loadCredentials('./runtime-configurator-credentials').then(() => {
  // config.get("clientId", "google_auth_services").then((value) => {
  //   console.log(value)
  // })
  console.log('list configs')
  return config.listConfigs()
}).then((value) => {
  console.log(value)
  console.log('get config')
  return config.getConfig("google_auth_services")
}).then((value) => {
  console.log(value)
  console.log('delete config')
  return config.deleteConfig("google_auth_services")
}).then((value) => {
  console.log('create config')
  return config.createConfig("google_auth_services")
}).then(() => {
  console.log('update config')
  return config.updateConfig("google_auth_services", "here is a new description")
}).then(() => {
  console.log('create variable')
  var buf = Buffer.from("here is a buffer");
  return config.createVariableWithBuffer("new_buffer_variable", buf, "google_auth_services")
}).then((value) => {
  console.log(value)
  return config.createVariableWithString("new_string_variable", "here is a string", "google_auth_services")
}).the
process.env.GOOGLE_CLOUD_PROJECT = "squashed-melon"

var config = new CloudConfig()
config.loadCredentials('./runtime-configurator-credentials').then(() => {
  // config.get("clientId", "google_auth_services").then((value) => {
  //   console.log(value)
  // })
  console.log('list configs')
  return config.listConfigs()
}).then((value) => {
  console.log(value)
  console.log('get config')
  return config.getConfig("google_auth_services")
}).then((value) => {
  console.log(value)
  console.log('delete config')
  return config.deleteConfig("google_auth_services")
}).then((value) => {
  console.log('create config')
  return config.createConfig("google_auth_services")
}).then(() => {
  console.log('update config')
  return config.updateConfig("google_auth_services", "here is a new description")
}).then(() => {
  console.log('create variable')
  var buf = Buffer.from("here is a buffer");
  return config.createVariableWithBuffer("new_buffer_variable", buf, "google_auth_services")
}).then((value) => {
  console.log(value)
  return config.createVariableWithString("new_string_variable", "here is a string", "google_auth_services")
}).then((value) => {
  console.log(value)
  return config.createVariableWithBool("new_bool_variable", true, "google_auth_services")
}).then((value) => {
  console.log(value)
  console.log('list variables')
  return config.listVariables("google_auth_services")
}).then((value) => {
  console.log(value)
  return config.getVariable("new_string_variable", "google_auth_services")
}).then((value) => {
  console.log(value)
  return config.updateVariableWithBool("new_bool_variable", false, "google_auth_services")
}).then((value) => {
  console.log(value)
  return config.getVariable("new_bool_variable", "google_auth_services")
}).then((value) => {
  console.log(value)
  return config.getVariable("new_buffer_variable", "google_auth_services")
}).then((value) => {
  console.log(value)
  return config.deleteVariable("new_buffer_variable", "google_auth_services")
})

// justAGuy.name = 'martin' // The setter will be used automatically here.
// justAGuy.sayHello() // Will output 'Hello, my name is Martin, I have ID: id_1'
//
//
// module.exports =n((value) => {
  console.log(value)
  return config.createVariableWithBool("new_bool_variable", true, "google_auth_services")
}).then((value) => {
  console.log(value)
  console.log('list variables')
  return config.listVariables("google_auth_services")
}).then((value) => {
  console.log(value)
  return config.getVariable("new_string_variable", "google_auth_services")
}).then((value) => {
  console.log(value)
  return config.updateVariableWithBool("new_bool_variable", false, "google_auth_services")
}).then((value) => {
  console.log(value)
  return config.getVariable("new_bool_variable", "google_auth_services")
}).then((value) => {
  console.log(value)
  return config.getVariable("new_buffer_variable", "google_auth_services")
}).then((value) => {
  console.log(value)
  return config.deleteVariable("new_buffer_variable", "google_auth_services")
})

// justAGuy.name = 'martin' // The setter will be used automatically here.
// justAGuy.sayHello() // Will output 'Hello, my name is Martin, I have ID: id_1'
//
//
// module.exports =
