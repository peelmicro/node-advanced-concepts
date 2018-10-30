const AWS = require('aws-sdk');
const requireLogin = require('../middlewares/requireLogin')
const uuid = require('uuid/v1');
const keys = require('../config/keys');

// const s3 = new AWS.S3({
//   accessKeyId: keys.s3AccessKeyId,
//   secretAccessKey: keys.s3SecretAccessKey,
//   region: 'eu-west-1'
// })

const s3 = new AWS.S3({
  accessKeyId: keys.s3AccessKeyId,
  secretAccessKey: keys.s3SecretAccessKey
})


module.exports = app => {
  app.get('/api/upload', requireLogin, async (req, res) => {
    const key = `${req.user.id}/${uuid()}.jpeg`;
    s3.getSignedUrl('putObject', {
      Bucket: 'the-blog-dev-bucket',
      ContentType: 'image/jpeg',
      Key: key
    }, (err, url) => res.send({ key, url }));
  });
};

