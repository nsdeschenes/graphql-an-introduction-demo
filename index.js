const { PubSub } = require('apollo-server')

const PORT = 3000
const PUBSUB_STRING = 'allUsersPubSub'
const mailingList = ['john@test.ca', 'jane@test.ca']

const { Server } = require('./src/server')

;(async () => {
  const pubsub = new PubSub()

  Server(PORT, { pubsub, PUBSUB_STRING, mailingList }).listen(PORT, (err) => {
    if (err) throw err
  })
})()
