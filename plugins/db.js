const Datastore = require('nedb');

const dbPlugin = {
    register: function (server, options, next) {
        const db = {
            account: new Datastore(),
            worlds: new Datastore(),
            values: new Datastore(),
        };

        server.decorate('server', 'db', db);
        server.decorate('request', 'db', db);

        next();
    }
};

dbPlugin.register.attributes = {
    name: 'dbPlugin',
    version: '1.0.0'
};

module.exports = dbPlugin;
