const Path = require('path');
const Hapi = require('hapi');
const HapiSwagger = require('hapi-swagger');
const Primus = require('primus');

const server = new Hapi.Server({
    connections: {
        routes: {
            files: {
                relativeTo: Path.resolve(__dirname, './public/')
            }
        }
    }
});

server.connection({
    port: 8080
});

const primus = new Primus(server.listener, {/* options */});

server.register(
    [
        require('inert'),
        require('vision'),
        {
            register: HapiSwagger,
            options: {
                info: {
                    title: 'API Documentation',
                }
            }
        },
        require('./plugins/db.js'),
        require('./plugins/auth.js'),
        require('./routes/account.js'),
        require('./routes/world.js'),
        require('./routes/values.js'),
        require('./routes/public.js')
    ], (err) => {
        console.log(err);

        if (err) {
            throw err;
        }

        primus.authorize(function (req, done) {
            const db = server.db.account;

            db.findOne({secret: req.query.secret}, function (err, doc) {
                if (!doc || err) {
                    return done(new Error('invalid token'));
                }

                return done();
            });
        });

        primus.on('connection', function (spark) {
            const db = server.db.account;
            db.findOne({secret: spark.query.secret}, function (err, doc) {
                if (!doc || err) {
                    console.log('could not attach account to connection');
                }
                else {
                    spark.username = doc.username;
                    spark.on('data', function(message) {
                        if (message.action === 'world' && message.world) {
                            spark.world = message.world
                        }
                        else if (message.world && message.action && message.key) {
                            primus.forEach(function(spark) {
                                if (spark.world === message.world) {
                                    spark.write({
                                        world: message.world,
                                        action: message.action,
                                        key: message.key
                                    });
                                }
                            });
                        }
                        else if (message.world && message.action === 'message' && message.message) {
                            primus.forEach(function(spark) {
                                if (spark.world === message.world) {
                                    spark.write({
                                        world: message.world,
                                        action: message.action,
                                        message: message.message
                                    });
                                }
                            });
                        }
                    });
                }
            });
        });

        server.start((err) => {

            if (err) {
                throw err;
            }

            console.log('Server running at:', server.info.uri);
        });

    });
