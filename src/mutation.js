const { GraphQLObjectType, GraphQLString, GraphQLNonNull } = require('graphql')
const { Email } = require('./scalar')

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

module.exports = {
  mutation,
}
