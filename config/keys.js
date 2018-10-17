if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'ci') {
  module.exports = require('./prod');
} else {
  module.exports = require('./dev');
}
