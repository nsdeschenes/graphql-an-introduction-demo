# GraphQL an Introduction Demo
This package is supplementary to my GraphQL an Introduction presentation which can be found [here](https://nsdeschenes.github.io/graphql-an-introduction/).

- [Getting Started](#getting-started)
- [Running Queries/Mutations/Subscriptions](#running-queries/mutations/subscriptions)
  - [Run a Query](#run-a-query)
  - [Run a Mutation](#run-a-mutation)
  - [Run a Subscription](#run-a-subscription)
- [Code Explanation](#code-explanation)
  - [Query Code](#query-code)
  - [Mutation Code](#mutation-code)
  - [Subscription Code](#subscription-code)
  - [Scalar Code](#scalar-code)
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
a user to add a new email to the mailing list that is stored on the server.
```graphql
mutation {
  addEmail (name: "mike@email.ca")
}
```
### Run a Subscription
In GraphQL subscriptions are used to watch the state of the server.
For this demo, whenever a new email is added to the list, the mailing list 
is then pushed to the subscription and back to the user running it.
```graphql
subscription {
  mailingList
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
    mailingListCount: {
      type: GraphQLInt,
      description: 'The current amount of users in the mailing list.',
      resolve: async (_source, _args, { mailingList }) => {
        return mailingList.length
      },
    },
  }),
})
```
In [query.js](https://github.com/nsdeschenes/graphql-an-introduction-demo/blob/master/src/query.js) 
we create a very simple query that best represents the purposes of queries which is allowing the
user to get the current state. We do this here by returning the current amount of users that are
stored in the mailing list.

### Mutation Code
```js
// src/mutations.js
const mutation = new GraphQLObjectType({
  name: 'Mutation',
  description: 'Base Mutation Object',
  fields: () => ({
    addEmail: {
      type: GraphQLString,
      description: 'Add new user to a mailing list.',
      args: {
        email: {
          type: new GraphQLNonNull(Email),
          description: "User's email.",
        },
      },
      resolve: async (
        _source,
        { email },
        { pubsub, PUBSUB_STRING, mailingList },
      ) => {
        mailingList.push(email)
        pubsub.publish(PUBSUB_STRING, { mailingList })
        return `User: ${email} was successfully added to mailing list.`
      },
    },
  }),
})
```
In [mutation.js](https://github.com/nsdeschenes/graphql-an-introduction-demo/blob/master/src/mutation.js)
we create a mutation that allows us to change the state of the server by adding a new email to the list,
we then return a string informing the user that the email was added to the list. We also push the updated 
mailing list to the subscription, which will be covered below. 

### Subscription Code
```js
// src/subscription.js
const subscription = new GraphQLObjectType({
  name: 'Subscription',
  description: 'Base Subscription',
  fields: () => ({
    mailingList: {
      type: new GraphQLList(Email),
      description: 'Push all emails in mailing list, when a new one is added.',
      resolve: async ({ mailingList }) => {
        return mailingList
      },
      subscribe: (_source, _args, { pubsub, PUBSUB_STRING }) =>
        pubsub.asyncIterator(PUBSUB_STRING),
    },
  }),
})
```
In [subscription.js](https://github.com/nsdeschenes/graphql-an-introduction-demo/blob/master/src/subscription.js)
we use an `asyncIterator` to setup the subscription to listen on a certain channel defined in the 
[entry-point](#entrypoint-code). Whenever a mutation is ran it pushes the updated mailing list to any 
user currently listening to the subscription.

### Scalar Code
```js
// src/scalar.js
const validate = (value) => {
  const EMAIL_REGEX = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/

  if (typeof value !== typeof 'string') {
    throw new TypeError(`Value is not a string: ${typeof value}`)
  }
  if (!EMAIL_REGEX.test(value)) {
    throw new TypeError(`Value is not a valid email: ${value}`)
  }

  return value
}

module.exports.Email = new GraphQLScalarType({
  name: 'Email',
  description: 'String that conforms to an email structure.',
  serialize: validate,
  parseValue: validate,

  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(
        `Can only validate strings as emails but got a: ${ast.kind}`,
      )
    }
    return validate(ast.value)
  },
})
```
In [scalar.js](https://github.com/nsdeschenes/graphql-an-introduction-demo/blob/master/src/scalar.js)
we can define a custom scalar type that we can use throughout our API. In this demo we are creating 
a mailing list so we need a type that enforces that we can only input emails. Creating this custom
email scalar allows us to reject any bad or malicious inputs before they reach the business logic.

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
We create a factory function in [server.js](https://github.com/nsdeschenes/graphql-an-introduction-demo/blob/master/src/server.js)
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
[index.js](https://github.com/nsdeschenes/graphql-an-introduction-demo/blob/master/index.js) is
the entry point in our application. We define our constants used through out this demo,
and pass them into the context for use through out the server. We use the factory function
return value of the server to setup the server and listen on the specified port.
