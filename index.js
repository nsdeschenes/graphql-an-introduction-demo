const { PubSub } = require('apollo-server')

const PORT = 3000

const { Server } = require('./src/server')

;(async () => {
  const pubsub = new PubSub()

  Server({ pubsub }).listen(PORT, (err) => {
    if (err) throw err
  })
})()
