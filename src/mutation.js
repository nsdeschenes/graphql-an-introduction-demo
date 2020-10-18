const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLID,
} = require('graphql')

const mutation = new GraphQLObjectType({
  name: 'Mutation',
  description: 'Base Mutation Object',
  fields: () => ({
    whatsYourName: {
      type: GraphQLString,
      description: '',
      args: {
        name: {
          type: new GraphQLNonNull(GraphQLString),
          description: 'User\'s name.',
        },
        id: {
          type: GraphQLID,
          description: 'The ID used for sending name through subscription.',
        },
      },
      resolve: async (_source, { id, name }, { pubsub }) => {
        pubsub.publish(id, { name })
        return `Your name is: ${name}!`
      },
    },
  }),
})

module.exports = {
  mutation,
}
