const { clearHash } = require('../services/cache')
module.exports = async (req, res, next) => {
  await next()
  if (req.user) {
    clearHash(req.user.id)
  }
}
