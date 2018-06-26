const Path = require('path');
const Hapi = require('hapi');
const HapiSwagger = require('hapi-swagger');

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

        server.start((err) => {

            if (err) {
                throw err;
            }

            console.log('Server running at:', server.info.uri);
        });

    });
