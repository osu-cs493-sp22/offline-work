const tf = require('@tensorflow/tfjs-node')
const mobilenet = require('@tensorflow-models/mobilenet')

const { connectToDB } = require('./lib/mongo')
const { connectToRabbitMQ, getChannel } = require('./lib/rabbitmq')
const {
    getDownloadStreamById,
    updateImageTagsById
} = require('./models/image')

const queue = 'images'

connectToDB(async function () {
    await connectToRabbitMQ(queue)
    const channel = getChannel()
    const classifier = await mobilenet.load()

    channel.consume(queue, async function (msg) {
        if (msg) {
            const id = msg.content.toString()
            const downloadStream = getDownloadStreamById(id)

            const imageData = []
            downloadStream.on('data', function (data) {
                imageData.push(data)
            })
            downloadStream.on('end', async function () {
                const img = tf.node.decodeImage(Buffer.concat(imageData))
                const classifications = await classifier.classify(img)
                console.log(classifications)
                const tags = classifications
                    .filter(classif => classif.probability > 0.5)
                    .map(classif => classif.className)
                console.log(tags)
                await updateImageTagsById(id, tags)
            })
        }
        channel.ack(msg)
    })
})
