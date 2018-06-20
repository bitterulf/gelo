const Joi = require('joi');
const Boom = require('boom');

const valuesRoutes = {
    register: function (server, options, next) {
        const valuesResponse = Joi.object().keys({
            values: Joi.array().items(
                Joi.object().keys({
                    key: Joi.string().required(),
                    value: Joi.string().required()
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

        const valuePayload = Joi.object().keys({
            key: Joi.string().required(),
            value: Joi.string().required()
        });

        const valueResponse = Joi.object().keys({
            key: Joi.string().required(),
            value: Joi.string().required()
        });

        server.route({
            method: 'GET',
            path: '/world/{world}/values',
            config: {
                tags: ['api'],
                description: 'existing values',
                notes: 'returns values',
                plugins: {
                    'hapi-swagger': {
                        responses: {
                            '200': {
                                'description': 'Success',
                                schema: valuesResponse
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
                    params: Joi.object().keys({
                        world: Joi.string().required()
                    }),
                    headers: Joi.object().keys({
                        secret: Joi.string().required()
                    })
                },
                response: {
                    status: {
                        200: valuesResponse,
                        400: plainErrorWithValidationSchema,
                    }
                },
                handler: function (request, reply) {
                    const db = request.db.values;

                    db.find({world: request.params.world}, function (err, docs) {
                        if (err) {
                            return reply({
                                values: []
                            });
                        }

                        reply({
                            values: docs.map(function(doc) {
                                return {
                                    key: doc.key,
                                    value: doc.value
                                }
                            })
                        });
                    });
                }
            }
        });

        server.route({
            method: 'PUT',
            path: '/world/{world}/value/{key}',
            config: {
                tags: ['api'],
                description: 'store value',
                notes: 'return value',
                plugins: {
                    'hapi-swagger': {
                        responses: {
                            '200': {
                                'description': 'Success',
                                schema: valueResponse
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
                    params: Joi.object().keys({
                        world: Joi.string().required(),
                        key: Joi.string().required()
                    }),
                    headers: Joi.object().keys({
                        secret: Joi.string().required()
                    }),
                    payload: {
                        value: Joi.string().min(3).required(),
                    }
                },
                response: {
                    status: {
                        200: valueResponse,
                        400: plainErrorWithValidationSchema,
                    }
                },
                handler: function (request, reply) {
                    const db = request.db.values;

                    db.update({
                        world: request.params.world,
                        key: request.params.key,
                    },{
                        world: request.params.world,
                        key: request.params.key,
                        value: request.payload.value,
                        date: new Date()
                    },{
                        upsert: true
                    },function (err, newDoc) {
                        if (err) {
                            // do something here!
                        }

                        reply({
                            key: request.params.key,
                            value: request.payload.value
                        });
                    });
                }
            }
        });

        next();
    }
};

valuesRoutes.register.attributes = {
    name: 'valuesRoutes',
    version: '1.0.0'
};

module.exports = valuesRoutes;
