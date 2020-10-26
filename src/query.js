const { GraphQLObjectType, GraphQLInt } = require('graphql')

const query = new GraphQLObjectType({
  name: 'Query',
  description: 'Base Query Object',
  fields: () => ({
    userCount: {
      type: GraphQLInt,
      description: 'The current amount of users in the mailing list.',
      resolve: async (_source, _args, { mailingList }) => {
        return mailingList.length
      },
    },
  }),
})

module.exports = {
  query,
}
