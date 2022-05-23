const fs = require('fs')

const { ObjectId, GridFSBucket } = require('mongodb')

const { getDBReference } = require('../lib/mongo')

exports.saveImageFile = function (image) {
  return new Promise((resolve, reject) => {
    const db = getDBReference()
    const bucket = new GridFSBucket(db, { bucketName: 'images' })

    const metadata = {
      contentType: image.contentType,
      userId: image.userId
    }

    const uploadStream = bucket.openUploadStream(
      image.filename,
      { metadata: metadata }
    )

    fs.createReadStream(image.path)
      .pipe(uploadStream)
      .on('error', (err) => {
        reject(err)
      })
      .on('finish', (result) => {
        resolve(result._id)
      })
  })
}

exports.getImageInfoById = async function (id) {
  const db = getDBReference()
  const bucket = new GridFSBucket(db, { bucketName: 'images' })
  if (!ObjectId.isValid(id)) {
    return null
  } else {
    const results = await bucket.find({ _id: new ObjectId(id) })
      .toArray()
    return results[0]
  }
}

exports.getDownloadStreamByFilename = function (filename) {
  const db = getDBReference()
  const bucket = new GridFSBucket(db, { bucketName: 'images' })
  return bucket.openDownloadStreamByName(filename)
}

exports.getDownloadStreamById = function (id) {
  const db = getDBReference()
  const bucket = new GridFSBucket(db, { bucketName: 'images' })
  if (!ObjectId.isValid(id)) {
    return null
  } else {
    return bucket.openDownloadStream(new ObjectId(id))
  }
}

exports.updateImageTagsById = async function (id, tags) {
  const db = getDBReference()
  const collection = db.collection('images.files')
  if (!ObjectId.isValid(id)) {
    return null
  } else {
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { "metadata.tags": tags }}
    )
    return result.matchedCount > 0
  }
}
