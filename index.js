"use strict"

const isUndefined = require('lodash.isundefined'),
      isNull = require('lodash.isundefined'),
      isString  = require('lodash.isstring'),
      isObject  = require('lodash.isobject'),
      isBoolean = require('lodash.isboolean'),
      isNumber = require('lodash.isnumber'),
      assign  = require('lodash.assign'),
      map = require('lodash.map'),
      has = require('lodash.has');
const {promisify} = require('util')
const {google} = require('googleapis')
const runtimeConfig = google.runtimeconfig('v1beta1')
const readFileAsync = promisify(require('fs').readFile)
const crypto = require('crypto')
const Base64 = require('@ronomon/base64');
const NodeCache = require( "node-cache" );

const MAXIMUM_VARIABLE_SIZE_BYTES = 4096;
const ENCODING = 'utf8';

// limiter.removeTokens(1, function() {
//   callMyMessageSendingFunction(...)
// })
//
// function callMyMessageSendingFunction() {
//     requestsToday++
//     if (requestsToday < requestsLimitPerDay) {
//         makeAPICall()
//     }
// }

const hashString = (string) => {
  return crypto.createHash('md5').update(string).digest("hex")
}

const isEmpty = (variable) => {
  return isNull(variable) || isUndefined(variable) || (isString(variable) && variable.length === 0)
}

const isBase64Encoded = (value) => {
  const matches = value.match("/^([A-Za-z0-9+\/]{4})*([A-Za-z0-9+\/]{4}|[A-Za-z0-9+\/]{3}=|[A-Za-z0-9+\/]{2}==)$/")
  return matches !== null
}

class CloudConfig {
  constructor(newOpts) {
    let opts = {
      credentials: {
        client_email: null,
        private_key: null,
      },
      useCache: false,
      cacheSettings: {
        stdTTL: 0,
        checkperiod: 600,
        errorOnMissing: false,
        useClones: true,
        deleteOnExpire: true
      },
      authScopes: ['https://www.googleapis.com/auth/cloudruntimeconfig'],
      projectId: process.env.GOOGLE_CLOUD_PROJECT,
      defaultConfig: null,
      baseUrl: 'https://runtimeconfig.googleapis.com/v1beta1',
      RateLimiter: null,
      requestsToday: 0,
      requestsLimitPerDay: 200
    }
    assign(this, opts, newOpts)

    if (!this.projectId) {
      return new Error("No projectId passed")
    }

    if (!this.useCache) {
      this.cache = new NodeCache(this.cacheSettings);
    }

    // var RateLimiter = require('limiter').RateLimiter
    // if (!isNull(this.RateLimiter) && !isUndefined(this.RateLimiter)) {
    //   this.limiter = new RateLimiter(1, 250)
    // }
    // var limiter = new RateLimiter(1, 250)
    // var requestsToday = 0 // Gets reset on each "new" day
    // var requestsLimitPerDay = 200
  }

  async loadCredentials(credentialsFile) {
    let credentials
    if (isString(credentialsFile)) {
      credentials = JSON.parse(await readFileAsync(credentialsFile, 'utf8'))
    }
    if (isEmpty(credentials) || !isObject(credentials)) {
      return Promise.reject("No credentials passed")
    }
    this.credentials = credentials
    this.jwtClient = new google.auth.JWT(
      this.credentials.client_email,
      null,
      this.credentials.private_key,
      this.authScopes
    )
    return Promise.resolve()
  }

  /** Variables **/
  async createVariableWithBuffer(varName, buf, configName) {
    return this._setVariable(varName, buf, false, configName, false)
  }

  async createVariableWithString(varName, varValue, configName) {
    return this._setVariable(varName, varValue, true, configName, false)
  }

  async createVariableWithBool(varName, varValue, configName) {
    return this._setVariable(varName, varValue.toString(), true, configName, false)
  }

  async createVariableWithObjectJSON(varName, varValue, configName) {
    return this._setVariable(varName, JSON.stringify(varValue,null,0), true, configName, false)
  }

  async updateVariableWithBuffer(varName, buf, configName) {
    return this._setVariable(varName, buf, false, configName, true)
  }

  async updateVariableWithString(varName, varValue, configName) {
    return this._setVariable(varName, varValue, true, configName, true)
  }

  async updateVariableWithBool(varName, varValue, configName) {
    return this._setVariable(varName, varValue.toString(), true, configName, true)
  }

  async updateVariableWithObjectJSON(varName, varValue, configName) {
    return this._setVariable(varName, JSON.stringify(varValue,null,0), true, configName, true)
  }

  async _setVariable(varName, varValue, isText, configName, update) {
    return new Promise((resolve, reject) => {
      if (isEmpty(configName)) {
        configName = this.defaultConfig
        if (isEmpty(configName)) {
          return Promise.reject("Config Name not set!")
        }
      }
      if (isEmpty(varName)) {
        return Promise.reject("Variable Name not set!")
      }
      if (!isBoolean(isText)) isText = true

      if (isText && Buffer.isBuffer(varValue)) {
        Promise.reject("Variable value is binary, is marked as text!")
      }
      // Check for correct varValue format and adjust if necessary
      if (isNull(varValue) || isUndefined(varValue)) {
        varValue = ""
      }
      if (isObject(varValue)) {
        varValue = JSON.stringify(varValue,null,0)
      }
      if (!isString(varValue)) {
        varValue = varValue.toString()
      }
      if (!isText) {
        if ((isString(varValue) && !isBase64Encoded(varValue)) || Buffer.isBuffer(varValue)) {
          if (Buffer.byteLength(varValue, ENCODING) > 27) {
            if (!Buffer.isBuffer(varValue)) varValue = Buffer.from(varValue, ENCODING)
            varValue = Base64.encode(varValue).toString('ascii')
          } else {
            varValue = Base64.encode(Buffer.from("")).toString('ascii')
          }
        } else {
          Promise.reject("Variable value is binary, but is not a buffer or string!")
        }
      }

      // Check for length
      if ((isText && Buffer.byteLength(varValue, ENCODING) > MAXIMUM_VARIABLE_SIZE_BYTES) ||
          (!isText && Buffer.isBuffer(varValue) && varValue.length > MAXIMUM_VARIABLE_SIZE_BYTES) ||
          (!isText && isString(varValue) && Buffer.byteLength(varValue, ENCODING) > MAXIMUM_VARIABLE_SIZE_BYTES)) {
        return Promise.reject("Variable value too large")
      }

      let params = {
        auth: this.jwtClient,
        resource: {
          name: `projects/${this.projectId}/configs/${configName}/variables/${varName}`
        }
      }
      if (update) {
        params.name = `projects/${this.projectId}/configs/${configName}/variables/${varName}`
      } else {
        params.requestId = hashString(this.projectId + configName + varName + varValue) // Add request ID so we don't double up
        params.parent = `projects/${this.projectId}/configs/${configName}`
      }
      if (isText) {
        params.resource.text = varValue
      } else {
        params.resource.value = varValue
      }

      if (update) {
        runtimeConfig.projects.configs.variables.update(params, (err, response) => {
            if (err) return reject(err)
            resolve(response.data)
          })
      } else {
        runtimeConfig.projects.configs.variables.create(params, (err, response) => {
            if (err) return reject(err)
            resolve(response.data)
          })
      }
    })
  }

  async getVariable(varName, configName) {
    return new Promise((resolve, reject) => {
      if (isEmpty(configName)) {
        configName = this.defaultConfig
        if (isEmpty(configName)) {
          return Promise.reject("Config Name not set!")
        }
      }
      if (isEmpty(varName)) {
        return Promise.reject("Invalid varName")
      }
      const params = {
        auth: this.jwtClient,
        name: `projects/${this.projectId}/configs/${configName}/variables/${varName}`,
      }

      runtimeConfig.projects.configs.variables.get(params, (err, response) => {
          if (err) return reject(err)
          if (has(response.data, 'value')) {
            response.data.decodedValue = Base64.decode(Buffer.from(response.data.value, ENCODING))
          }
          resolve(response.data)
        })
    });
  }

  async deleteVariable(varName, configName) {
    return new Promise((resolve, reject) => {
      if (isEmpty(configName)) {
        configName = this.defaultConfig
        if (isEmpty(configName)) {
          return Promise.reject("Config Name not set!")
        }
      }
      if (isEmpty(varName)) {
        return Promise.reject("Invalid varName")
      }
      const params = {
        auth: this.jwtClient,
        name: `projects/${this.projectId}/configs/${configName}/variables/${varName}`,
      }

      runtimeConfig.projects.configs.variables.delete(params, (err, response) => {
          if (err) return reject(err)
          resolve(response.data)
        })
    });
  }

  async listVariables(configName, filter, pageSize, pageToken, returnValues) {
    return new Promise((resolve, reject) => {
      if (isEmpty(configName)) {
        configName = this.defaultConfig
        if (isEmpty(configName)) {
          return Promise.reject("Config Name not set!")
        }
      }

      if (!isNumber(pageSize)) pageSize = 1000;
      if (!isBoolean(returnValues)) returnValues = true

      const params = {
        pageSize: pageSize,
        auth: this.jwtClient,
        parent: `projects/${this.projectId}/configs/${configName}`,
      }
      if (!isEmpty(pageToken)) {
        params.pageToken = pageToken
      }
      if (!isEmpty(filter)) {
        params.filter = `projects/${this.projectId}/config/${configName}/variables/${filter}.`
      }

      runtimeConfig.projects.configs.variables.list(params, (err, response) => {
          if (err) return reject(err)
          resolve(response.data.variables)
        })
    })
  }

  /** Configs **/
  async createConfig(configName, configDescription) {
    return new Promise((resolve, reject) => {
      if (isEmpty(configName)) {
        configName = this.defaultConfig
        if (isEmpty(configName)) {
          return Promise.reject("Config Name not set!")
        }
      }

      const params = {
        requestId: hashString(this.projectId + configName), // Add request ID so we don't double up
        auth: this.jwtClient,
        parent: `projects/${this.projectId}`,
        resource: {
          name: `projects/${this.projectId}/configs/${configName}`,
        }
      }

      if (!isEmpty(configDescription)) {
        params.resource.description = configDescription
      }

      runtimeConfig.projects.configs.create(params, (err, response) => {
          if (err) return reject(err)
          resolve()
        })
    })
  }

  async updateConfig(configName, configDescription) {
    return new Promise((resolve, reject) => {
      if (isEmpty(configName)) {
        configName = this.defaultConfig
        if (isEmpty(configName)) {
          return Promise.reject("Existing Config Name not set!")
        }
      }

      const params = {
        auth: this.jwtClient,
        name: `projects/${this.projectId}/configs/${configName}`,
        resource: {
          name: `projects/${this.projectId}/configs/${configName}`
        }
      }

      if (!isEmpty(configDescription)) {
        params.resource.description = configDescription
      }

      runtimeConfig.projects.configs.update(params, (err, response) => {
          if (err) return reject(err)
          resolve()
        })
    })
  }

  async deleteConfig(configName) {
    return new Promise((resolve, reject) => {
      if (isEmpty(configName)) {
        configName = this.defaultConfig
        if (isEmpty(configName)) {
          return Promise.reject("Config Name not set!")
        }
      }

      const params = {
        auth: this.jwtClient,
        name: `projects/${this.projectId}/configs/${configName}`
      }

      runtimeConfig.projects.configs.delete(params, (err, response) => {
          if (err) return reject(err)
          resolve()
        })
    })
  }

  async getConfig(configName) {
    return new Promise((resolve, reject) => {
      if (isEmpty(configName)) {
        configName = this.defaultConfig
        if (isEmpty(configName)) {
          return Promise.reject("Config Name not set!")
        }
      }

      const params = {
        auth: this.jwtClient,
        name: `projects/${this.projectId}/configs/${configName}`
      }

      runtimeConfig.projects.configs.get(params, (err, response) => {
          if (err) return reject(err)
          resolve(response.data)
        })
    })
  }

  async listConfigs() {
    return new Promise((resolve, reject) => {
      const params = {
        auth: this.jwtClient,
        name: `projects/${this.projectId}/configs`
      }

      runtimeConfig.projects.configs.get(params, (err, response) => {
          if (err) return reject(err)
          resolve(response.data.configs)
        })
    })
  }
}

module.exports = CloudConfig

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
// module.exports =
