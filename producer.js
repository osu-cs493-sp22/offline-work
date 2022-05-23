const amqp = require('amqplib')

const rabbitmqHost = process.env.RABBITMQ_HOST || 'localhost'
const rabbitmqUrl = `amqp://${rabbitmqHost}`

async function main() {
    const connection = await amqp.connect(rabbitmqUrl)
    const channel = await connection.createChannel()
    await channel.assertQueue('echo')

    const sentence = "The quick brown fox jumped over the lazy dog"
    sentence.split(' ').forEach(function (word) {
        channel.sendToQueue('echo', Buffer.from(word))
    })

    setTimeout(function () {
        connection.close()
    }, 500)
}

main()
