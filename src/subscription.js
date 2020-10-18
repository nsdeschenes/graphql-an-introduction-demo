const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLID,
  GraphQLNonNull,
} = require('graphql')

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

module.exports = {
    subscription,
}