const Joi = require('joi');
const Boom = require('boom');

const worldRoutes = {
    register: function (server, options, next) {
        const worldsResponse = Joi.object().keys({
            worlds: Joi.array().items(
                Joi.object().keys({
                    name: Joi.string().required(),
                    owner: Joi.string().required()
                })
            ).required()
        });

        const plainErrorSchema = Joi.object().keys({
            statusCode: Joi.number().required(),
            error: Joi.string().min(1).required(),
            message: Joi.string().min(1).required()
        });

        const plainErrorWithValidationSchema = Joi.object().keys({
            statusCode: Joi.number().required(),
            error: Joi.string().min(1).required(),
            message: Joi.string().min(1).required(),
            validation: Joi.object().keys({
                source: Joi.string().min(1).required(),
                keys: Joi.array().items(Joi.string()).required()
            })
        });

        const worldPayload = Joi.object().keys({
            name: Joi.string().required()
        });

        const worldResponse = Joi.object().keys({
            name: Joi.string().required(),
            owner: Joi.string().required()
        });

        server.route({
            method: 'GET',
            path: '/worlds',
            config: {
                tags: ['api'],
                description: 'existing worlds',
                notes: 'returns name',
                plugins: {
                    'hapi-swagger': {
                        responses: {
                            '200': {
                                'description': 'Success',
                                schema: worldsResponse
                            },
                            '400': {
                                'description': 'Bad Request',
                                schema: plainErrorWithValidationSchema
                            }
                        }
                    }
                },
                validate: {
                    options: {
                      allowUnknown: true
                    },
                    headers: Joi.object().keys({
                        secret: Joi.string().required()
                    })
                },
                response: {
                    status: {
                        200: worldsResponse,
                        400: plainErrorWithValidationSchema,
                    }
                },
                handler: function (request, reply) {
                    const db = request.db.worlds;

                    db.find({}, function (err, docs) {
                        if (err) {
                            return reply({
                                worlds: []
                            });
                        }

                        reply({
                            worlds: docs.map(function(doc) {
                                return {
                                    name: doc.name,
                                    owner: doc.owner
                                }
                            })
                        });
                    });
                }
            }
        });

        server.route({
            method: 'PUT',
            path: '/world',
            config: {
                tags: ['api'],
                description: 'create new world',
                notes: 'return world',
                plugins: {
                    'hapi-swagger': {
                        responses: {
                            '200': {
                                'description': 'Success',
                                schema: worldResponse
                            },
                            '409': {
                                'description': 'Conflict',
                                schema: plainErrorSchema
                            },
                            '400': {
                                'description': 'Bad Request',
                                schema: plainErrorWithValidationSchema
                            }
                        }
                    }
                },
                validate: {
                    options: {
                      allowUnknown: true
                    },
                    headers: Joi.object().keys({
                        secret: Joi.string().required()
                    }),
                    payload: worldPayload
                },
                response: {
                    status: {
                        200: worldResponse,
                        409: plainErrorSchema,
                        400: plainErrorWithValidationSchema,
                    }
                },
                handler: function (request, reply) {
                    const db = request.db.worlds;

                    db.findOne({secret: request.payload.name}, function (err, doc) {
                        if (doc || err) {
                            return reply(Boom.conflict('world conflict'));
                        }
                        db.insert({
                            name: request.payload.name,
                            owner: request.user.username,
                            date: new Date()
                        }, function (err, newDoc) {
                            if (err) {
                                return reply(Boom.conflict('world conflict'));
                            }

                            return reply({
                                name: newDoc.name,
                                owner: newDoc.owner
                            });
                        })
                    });
                }
            }
        });

        next();
    }
};

worldRoutes.register.attributes = {
    name: 'worldRoutes',
    version: '1.0.0'
};

module.exports = worldRoutes;
