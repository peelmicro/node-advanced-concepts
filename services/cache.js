const mongoose = require('mongoose')
const redis = require('redis')
const redisUrl = 'redis://127.0.0.1:6379'
const client = redis.createClient(redisUrl)
const util = require('util')
client.hget = util.promisify(client.hget)

const exec = mongoose.Query.prototype.exec

mongoose.Query.prototype.cache = function(options = {}) {
  this.useCache = true
  this.hashKey = JSON.stringify(options.key || '')
  return this
}

mongoose.Query.prototype.exec = async function() {
  if (!this.useCache) {
    return exec.apply(this, arguments)
  }
  const key = JSON.stringify(
    Object.assign({}, this.getQuery(), {
      collection: this.mongooseCollection.name
    })
  )

  // See if we have a value for 'key in redis
  const cachedValue = await client.hget(this.hashKey, key)
  // If we do, return that
  if (cachedValue) {
    const doc = JSON.parse(cachedValue)
    return Array.isArray(doc)
      ? doc.map(d => new this.model(d))
      : this.model(doc)
  }
  // Otherwise, issue the query and store the result in redis
  const result = await exec.apply(this, arguments)
  // This is not working
  // client.hset(this.hashKey, key, JSON.stringify(result), 'EX', 10)
  client.hset(this.hashKey, key, JSON.stringify(result))
  // This set the expiry time in seconds for the whole hash Key
  client.expire(this.hashKey, 60)
  return result
}

module.exports = {
  clearHash(hashKey) {
    client.del(JSON.stringify(hashKey))
  }
}
