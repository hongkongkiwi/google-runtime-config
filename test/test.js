"use strict"

require('dotenv').config()

;(async () => {
  try {
    const CloudConfig = require('../index')
    const config = new CloudConfig()
    console.log('Load Configs')
    const creds = await config.loadCredentials(process.env.GOOGLE_CLOUD_CREDENTIALS)

    console.log('list configs')
    const listConfigs = await config.listConfigs()
    console.log(listConfigs)

    console.log('Get config')
    const getConfig = await config.getConfig("google_auth_services")
    console.log(getConfig)

    console.log('Delete Config')
    await config.deleteConfig("google_auth_services")

    console.log('Create Config')
    await config.createConfig("google_auth_services")

    console.log('Update Config')
    const updateConfig = await config.updateConfig("google_auth_services", "here is a new description")

    console.log('createVariableWithBuffer')
    const buf = Buffer.from("here is a buffer")
    const createVariableWithBuffer = await config.createVariableWithBuffer("new_buffer_variable", buf, "google_auth_services")
    console.log(createVariableWithBuffer)

    console.log('createVariableWithString')
    const createVariableWithString = await config.createVariableWithString("new_string_variable", "here is a string", "google_auth_services")
    console.log(createVariableWithString)

    console.log('createVariableWithBool')
    const createVariableWithBool = await config.createVariableWithBool("new_bool_variable", true, "google_auth_services")
    console.log(createVariableWithBool)

    console.log('List Variables')
    const listVariables = await config.listVariables("google_auth_services")
    console.log(listVariables)

    console.log('Get String Variable')
    const getStringVariable = await config.getVariable("new_string_variable", "google_auth_services")
    console.log(getStringVariable)

    console.log('updateVariableWithBool')
    const updateVariableWithBool = await config.updateVariableWithBool("new_bool_variable", false, "google_auth_services")
    console.log(updateVariableWithBool)

    console.log('Get Bool Variable')
    const getBoolVariable = await config.getVariable("new_bool_variable", "google_auth_services")
    console.log(getBoolVariable)

    console.log('Get Buffer Variable')
    const getBufferVariable = await config.getVariable("new_buffer_variable", "google_auth_services")
    console.log(getBufferVariable)

    console.log('Delete Buffer Variable')
    const deleteVariable = await config.deleteVariable("new_buffer_variable", "google_auth_services")
  } catch (e) {
    // Deal with the fact the chain failed
    console.error(e)
    throw e
  }
})()
