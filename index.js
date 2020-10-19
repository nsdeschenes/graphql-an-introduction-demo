const { PubSub } = require('apollo-server')

const PORT = 3000
const PUBSUB_STRING = 'allUsersPubSub'
const userList = ['John', 'Jane']

const { Server } = require('./src/server')

;(async () => {
  const pubsub = new PubSub()

  Server(PORT, { pubsub, PUBSUB_STRING, userList }).listen(PORT, (err) => {
    if (err) throw err
  })
})()
