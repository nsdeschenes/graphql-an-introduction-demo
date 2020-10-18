const { GraphQLObjectType, GraphQLString } = require('graphql')

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

module.exports = {
  query,
}
