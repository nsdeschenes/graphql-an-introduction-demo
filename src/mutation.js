const { GraphQLObjectType, GraphQLString, GraphQLNonNull } = require('graphql')

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
        _source,
        { name },
        { pubsub, PUBSUB_STRING, userList },
      ) => {
        userList.push(name)
        pubsub.publish(PUBSUB_STRING, { userList })
        return `User: ${name} was successfully added.`
      },
    },
  }),
})

module.exports = {
  mutation,
}
