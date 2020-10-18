const express = require('express')
const { GraphQLSchema } = require('graphql')
const { createServer } = require('http')
const { ApolloServer } = require('apollo-server-express')

const { query } = require('./query')
const { mutation } = require('./mutation')
const { subscription } = require('./subscription')

const Server = (port, context = {}) => {
  const app = express()

  app.get('/alive', (_req, res) => {
    res.json({ ok: 'yes' })
  })
  app.get('/ready', (_req, res) => {
    res.json({ ok: 'yes' })
  })

  const server = new ApolloServer({
    schema: new GraphQLSchema({
      query: query,
      mutation: mutation,
      subscription: subscription,
    }),
    context: ({ req, res }) => {
      return {
        req,
        res,
        ...context,
      }
    },
  })

  server.applyMiddleware({ app })

  const httpServer = createServer(app)

  server.installSubscriptionHandlers(httpServer)

  console.log(`🚀 Server ready at http://localhost:${port}${server.graphqlPath}`)
  console.log(
    `🚀 Subscriptions ready at ws://localhost:${port}${server.subscriptionsPath}`,
  )
  return httpServer
}

module.exports = {
  Server,
}
