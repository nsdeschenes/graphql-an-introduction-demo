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
There is one demo query included in the server, to run 
the query paste the following into the playground.
```graphql
query {
  hello
}
```
### Run a Mutation
There is one demo mutation included in the server, to 
run the mutation paste the following into the playground.
```graphql
mutation {
  whatsYourName (name: "John")
}
```
### Run a Subscription
There is one demo mutation included in the server, to 
run the mutation paste the following into the playground.
```graphql
subscription {
  pushUserNames (id: 1)
}
```
However you will notice that nothing actually happens, this
is because we are using Pub-Subs, so you will need to open a
new window in the playground and run the following mutation.
```graphql
mutation {
  whatsYourName (name: "John", id: 1)
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
    hello: {
      type: GraphQLString,
      description: 'Hello World!',
      resolve: async () => {
        return 'World!'
      },
    },
  }),
})
```
In [query.js](https://github.com/nslandolt/graphql-an-introduction-demo/blob/master/src/query.js)
we create the base or root query. A root type is required for any subsequent field (i.e. queries).
We start off by declaring a new `GraphQLObjectType` and start filling out the various fields such as
`name`, and `description`. When we reach the `fields` field, we create an anonymous function that returns
the different queries. In this example it is not required however later on as you expand your schema, you 
may have types that include other types, but those children types then return the original type so it will
cause issues when generating the schema, the anonymous function solves this issue. So now we start creating
the fields that can be queried, to keep it simple there is only one field `hello` that when queried will
resolve and return `World!` when executed.

### Mutation Code
```js
// src/mutations.js
const mutation = new GraphQLObjectType({
  name: 'Mutation',
  description: 'Base Mutation Object',
  fields: () => ({
    whatsYourName: {
      type: GraphQLString,
      description: 'A simple mutation to demo its functionality.',
      args: {
        name: {
          type: new GraphQLNonNull(GraphQLString),
          description: 'User\'s name.',
        },
        id: {
          type: GraphQLID,
          description: 'The ID used for sending name through subscription.',
        },
      },            /* source    args          context */
      resolve: async (_source, { id, name }, { pubsub }) => {
        pubsub.publish(id, { name })
        return `Your name is: ${name}!`
      },
    },
  }),
})
```
In [mutation.js](https://github.com/nslandolt/graphql-an-introduction-demo/blob/master/src/mutation.js)
again like the query above we have to create the root mutation. We follow the same pattern as the query
above with the `name`, `description`, and `fields`. Here however we also the `args` field to the mutation
this field allows us to accept arguments from the user. (Note: args are also available with queries however
in this example they were not needed.) So since we define the schema in GraphQL we must define the arguments
as well. Arguments follow the same pattern as defining `mutations` or `queries` we have to provide the type
and a description, you can also see `GraphQLNonNull` being used this ensures that the argument cannot be left
empty or provided a null value. In the mutation resolver here you can see that it is a bit more complex than
the one being used in the [query](#query-code). 

### Subscription Code
```js
// src/subscription.js
const subscription = new GraphQLObjectType({
  name: 'Subscription',
  description: 'Base Subscription',
  fields: () => ({
    pushUserNames: {
      type: GraphQLString,
      description: 'Demo subscription example.',
      args: {
        id: {
          type: new GraphQLNonNull(GraphQLID),
          description: 'The ID of used by the mutation.',
        },
      },
      resolve: async ({ name }) => {
        return name
      },
      subscribe: (_, { id }, { pubsub }) => pubsub.asyncIterator(id),
    },
  }),
})
```
Text Here

### Server Code
```js
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
```
Text Here
