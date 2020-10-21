# GraphQL an Introduction Demo
This package is supplementary to my GraphQL an Introduction presentation which can be found [here](https://nslandolt.github.io/graphql-an-introduction/).

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
                    /* source   args    context  */
      resolve: async (_source, _args, { userList }) => {
        return userList.length
      },
    },
  }),
})
```
In [query.js](https://github.com/nslandolt/graphql-an-introduction-demo/blob/master/src/query.js) 
we create a very simple query that best represents the purposes of queries which is allowing the
user to get the current state. We do this here by returning the current amount of users that are
stored in the user list.

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
        _source,  // source
        { name }, // args
        { pubsub, PUBSUB_STRING, userList }, // context
      ) => {
        userList.push(name)
        pubsub.publish(PUBSUB_STRING, { userList })
        return `User: ${name} was successfully added.`
      },
    },
  }),
})
```
In [mutation.js](https://github.com/nslandolt/graphql-an-introduction-demo/blob/master/src/mutation.js)
we create a mutation that allows us to change the state of the server by adding a new user to the list,
we then return a string informing the user that the user was added to the list. We also push the updated 
list to the subscription, which will be covered below. 

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
      },         /* source   args         context        */
      subscribe: (_source, _args, { pubsub, PUBSUB_STRING }) =>
        pubsub.asyncIterator(PUBSUB_STRING),
    },
  }),
})
```
In [subscription.js](https://github.com/nslandolt/graphql-an-introduction-demo/blob/master/src/subscription.js)
we use an `asyncIterator` to setup the subscription to listen on a certain channel defined in the 
[entry-point](#entrypoint-code). Whenever a mutation is ran it pushes the updated list to any user
listening to the subscription.

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
We create a factory function in [server.js](https://github.com/nslandolt/graphql-an-introduction-demo/blob/master/src/server.js)
that we then use in the entry-point below. We first have to bring in the root objects that we created previously
to build our schema. The factory function takes in a port, and the context that gets passed in from the entry-point.
Having the context field as an anonymous function allows it to be re-created upon each request, this allows us to
gather the request and response express objects that we could use. We have to apply the middleware to the server
which allows us to serve our `ApolloServer`, to add WebSockets for the subscriptions we need to create a server
on the express app, we then install the required subscription handlers and return the corresponding httpServer. 

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
[index.js](https://github.com/nslandolt/graphql-an-introduction-demo/blob/master/index.js) is
the entry point in our application. We define our constants used through out this demo,
and pass them into the context for use through out the server. We use the factory function
return value of the server to setup the server and listen on the specified port.
