const { GraphQLObjectType, GraphQLString, GraphQLList } = require('graphql')

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

module.exports = {
  subscription,
}
