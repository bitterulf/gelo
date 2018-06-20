const Joi = require('joi');
const Boom = require('boom');

const accountRoutes = {
    register: function (server, options, next) {
        const schema = Joi.object().keys({
            _id: Joi.string().min(1).required(),
            username: Joi.string().min(1).required(),
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

        server.route({
            method: 'PUT',
            path: '/account',
            config: {
                tags: ['api'],
                description: 'account creation',
                notes: 'returns id',
                plugins: {
                    'hapi-swagger': {
                        responses: {
                            '200': {
                                'description': 'Success',
                                schema: schema
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
                    payload: {
                        secret: Joi.string().min(3).required(),
                        username: Joi.string().min(3).required()
                    }
                },
                response: {
                    status: {
                        200: schema,
                        409: plainErrorSchema,
                        400: plainErrorWithValidationSchema
                    }
                },
                handler: function (request, reply) {
                    const db = request.db.account;

                    db.findOne({secret: request.payload.secret}, function (err, doc) {
                        if (doc || err) {
                            return reply(Boom.conflict('account conflict'));
                        }
                        db.findOne({username: request.payload.username}, function (err, doc) {
                            if (doc || err) {
                                return reply(Boom.conflict('account conflict'));
                            }
                            db.insert({
                                username: request.payload.username,
                                secret: request.payload.secret,
                                date: new Date()
                            }, function (err, newDoc) {
                                if (err) {
                                    return reply(Boom.conflict('account conflict'));
                                }

                                return reply({
                                    _id: newDoc._id,
                                    username: newDoc.username
                                });
                            })
                        });
                    });
                }
            }
        });

        server.route({
            method: 'GET',
            path: '/account',
            config: {
                tags: ['api'],
                description: 'account test',
                notes: 'returns id',
                plugins: {
                    'hapi-swagger': {
                        responses: {
                            '200': {
                                'description': 'Success',
                                schema: schema
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
                        200: schema,
                        400: plainErrorWithValidationSchema,
                    }
                },
                handler: function (request, reply) {
                    reply(request.user);
                }
            }
        });

        next();
    }
};

accountRoutes.register.attributes = {
    name: 'accountRoutes',
    version: '1.0.0'
};

module.exports = accountRoutes;
