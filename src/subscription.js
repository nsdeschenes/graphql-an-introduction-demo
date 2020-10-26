const { GraphQLObjectType, GraphQLList } = require('graphql')
const { Email } = require('./scalar')

const subscription = new GraphQLObjectType({
  name: 'Subscription',
  description: 'Base Subscription',
  fields: () => ({
    mailingList: {
      type: new GraphQLList(Email),
      description: 'Push all users when a new one is added.',
      resolve: async ({ mailingList }) => {
        return mailingList
      },
      subscribe: (_source, _args, { pubsub, PUBSUB_STRING }) =>
        pubsub.asyncIterator(PUBSUB_STRING),
    },
  }),
})

module.exports = {
  subscription,
}
