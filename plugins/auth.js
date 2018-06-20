const Datastore = require('nedb');
const Boom = require('boom');

const authPlugin = {
    register: function (server, options, next) {

        server.ext('onRequest', (request, reply) => {
            if (!request.headers.secret) {
                return reply.continue();
            }

            server.db.account.findOne({ secret: request.headers.secret }, function(err, doc) {
                if (err || !doc) {
                    return reply(Boom.unauthorized());
                }
                request.user = {
                    _id: doc._id,
                    username: doc.username
                }
                reply.continue();
            });

        });

        next();
    }
};

authPlugin.register.attributes = {
    name: 'authPlugin',
    version: '1.0.0'
};

module.exports = authPlugin;
