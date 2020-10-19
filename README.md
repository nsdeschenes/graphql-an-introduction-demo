# GraphQL an Introduction Demo
This package is supplementary to my GraphQL an Introduction presentation which can also be found in its own repo [here](https://github.com/nslandolt/graphql-an-introduction).

- [Getting Started](#getting-started)
- [Running Queries/Mutations/Subscriptions](#running-queries/mutations/subscriptions)
  - [Run a Query](#run-a-query)
  - [Run a Mutation](#run-a-mutation)
  - [Run a Subscription](#run-a-subscription)
- [Code Explanation](#code-explanation)
  - [Query Code](#query-code)
  - [Mutation Code](#mutation-code)
  - [Subscription Code](#subscription-code)
  - [Server Code](#server-code)
  - [Entrypoint Code](#entrypoint-code)

## Getting Started
[Back to top](#graphql-an-introduction-demo)
### Installing Dependencies
```shell
npm install
```

### Running The Server
```shell
npm run start
```
Once the server is running it will log the url's that 
you can visit to try out GraphQL.

### Run a Query
Queries in GraphQL are used to get state. This example query
returns the amount of users that are currently on a list stored
in the server.
```graphql
query {
  userCount
}
```
### Run a Mutation
Mutations are used to modify the state. This mutations allows
a user to add a new user to the list that is stored on the server.
```graphql
mutation {
  addUser (name: "Mike")
}
```
### Run a Subscription
In GraphQL subscriptions are used to watch the state of the server.
For this demo, whenever a new user is added to the list, the list 
is then pushed to the subscription and back to the user running it.
```graphql
subscription {
  allUsers
}
```
- - -
## Code Explanation
[Back to top](#graphql-an-introduction-demo)
### Query Code
```js
// src/query.js
const query = new GraphQLObjectType({
  name: 'Query',
  description: 'Base Query Object',
  fields: () => ({
    userCount: {
      type: GraphQLInt,
      description: 'The current amount of users in the list.',
      resolve: async (_source, _args, { userList }) => {
        return userList.length
      },
    },
  }),
})
```
[query.js](https://github.com/nslandolt/graphql-an-introduction-demo/blob/master/src/query.js)


### Mutation Code
```js
// src/mutations.js
const mutation = new GraphQLObjectType({
  name: 'Mutation',
  description: 'Base Mutation Object',
  fields: () => ({
    addUser: {
      type: GraphQLString,
      description: 'Add new user to a list.',
      args: {
        name: {
          type: new GraphQLNonNull(GraphQLString),
          description: "User's name.",
        },
      },
      resolve: async (
        _source,
        { name },
        { pubsub, PUBSUB_STRING, userList },
      ) => {
        userList.push(name)
        pubsub.publish(PUBSUB_STRING, { userList })
        return `User: ${name} was successfully added.`
      },
    },
  }),
})
```
[mutation.js](https://github.com/nslandolt/graphql-an-introduction-demo/blob/master/src/mutation.js)


### Subscription Code
```js
// src/subscription.js
const subscription = new GraphQLObjectType({
  name: 'Subscription',
  description: 'Base Subscription',
  fields: () => ({
    allUsers: {
      type: new GraphQLList(GraphQLString),
      description: 'Push all users when a new one is added.',
      resolve: async ({ userList }) => {
        return userList
      },
      subscribe: (_source, _args, { pubsub, PUBSUB_STRING }) =>
        pubsub.asyncIterator(PUBSUB_STRING),
    },
  }),
})
```
[subscription.js](https://github.com/nslandolt/graphql-an-introduction-demo/blob/master/src/subscription.js)


### Server Code
```js
const { query } = require('./query')
const { mutation } = require('./mutation')
const { subscription } = require('./subscription')

const Server = (port, context = {}) => {
  const app = express()

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
```
[server.js](https://github.com/nslandolt/graphql-an-introduction-demo/blob/master/src/server.js)


### Entrypoint Code
```js
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
```
[index.js](https://github.com/nslandolt/graphql-an-introduction-demo/blob/master/index.js)