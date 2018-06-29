const getAPI = function(prefix) {
    const primus = Primus.connect('/primus?secret='+window.localStorage.getItem(prefix+'/secret'));
    window.primus = primus;

    const API = {
        on: function(event, cb) {
            primus.on(event, cb);
        },
        write: function(message) {
            primus.write(message);
        },
        message: function(message) {
            API.write({world: API.getWorld(), action: 'message', message: message});
        },
        setWorld: function(world) {
            window.localStorage.setItem(prefix+'/world', world);
        },
        getWorld: function(world) {
            return window.localStorage.getItem(prefix+'/world');
        },
        sendWorld: function(world) {
            API.write({action: 'world', world: API.getWorld()});
        },
        getWorld: function() {
            return window.localStorage.getItem(prefix+'/world');
        },
        getSecret: function() {
            return window.localStorage.getItem(prefix+'/secret');
        },
        setSecret: function(secret) {
            window.localStorage.setItem(prefix+'/secret', secret);
        },
        createWorld: function(worldName, cb) {
            m.request({
                method: 'PUT',
                url: '/world',
                data: {
                    name: worldName
                },
                headers: {
                    secret: API.getSecret()
                }
            })
            .then(function(result) {
                cb();
            })
            .catch(function() {
                cb();
            })
        },
        loadData: function(cb) {
            const secret = API.getSecret();
            const world = API.getWorld();

            m.request({
                method: 'GET',
                url: '/world/:world/values',
                headers: {
                    secret: secret
                },
                data: {
                    world: world
                }
            })
            .then(function(result) {
                const newState = {};
                result.values.forEach(function(entry) {
                    if (entry.key.indexOf('_') > -1) {
                        const keyparts = entry.key.split('_');
                        if (!newState[keyparts[0]]) {
                            newState[keyparts[0]] = {};
                        }
                        newState[keyparts[0]][keyparts[1]] = entry.value;
                    } else {
                        newState[entry.key] = entry.value;
                    }
                });
                cb(newState);
            });
        },
        setKey: function(key, value) {
            const secret = API.getSecret();
            const world = API.getWorld();

            m.request({
                method: 'PUT',
                url: '/world/:world/value/:key',
                headers: {
                    secret: secret
                },
                data: {
                    world: world,
                    key: key,
                    value: value
                }
            })
            .then(function(result) {
                API.write({action: 'update', world: world, key: key});
            });
        },
        updateSecret: function(cb) {
            const secret = API.getSecret();

            m.request({
                method: 'GET',
                url: '/account',
                headers: {
                    secret: secret
                }
            })
            .then(function(result) {
                cb(result.username);
            })
            .catch(function() {
                const newSecret = 'S' + Math.random();
                const username = 'user' + Math.random();

                m.request({
                    method: 'PUT',
                    url: '/account',
                    data: {
                        secret: newSecret,
                        username: username
                    }
                })
                .then(function(result) {
                    API.setSecret(newSecret);
                    cb(username);
                });
            })
        }
    };

    return API;
}
