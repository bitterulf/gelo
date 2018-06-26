const publicRoutes = {
    register: function (server, options, next) {
        server.route({
            method: 'GET',
            path: '/frontend/{param*}',
            handler: {
                directory: {
                    path: '.',
                    redirectToSlash: true,
                    index: true,
                }
            }
        });

        next();
    }
};

publicRoutes.register.attributes = {
    name: 'publicRoutes',
    version: '1.0.0'
};

module.exports = publicRoutes;
