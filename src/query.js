const { GraphQLObjectType, GraphQLInt } = require('graphql')

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

module.exports = {
  query,
}
