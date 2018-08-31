/*!
 * grpc-middleware
 * Copyright(c) 2018 Triple Take Technologies <jason@tripletaketechnologies.com>
 * MIT Licensed
 */

import grpc from 'grpc';

export * from 'grpc';

interface PreHandler {
    (context: Object, call: grpc.UntypedServiceImplementation): void;
}
interface PostHandler {
    (err: Error | null, context: Object, call: grpc.UntypedServiceImplementation): void;
}

interface MiddlewareHandler {
    (context: Object, call: grpc.UntypedServiceImplementation): void;
}

export class Server extends grpc.Server {
    preHandler?: PreHandler;
    postHandler?: PostHandler;
    services: Array<grpc.UntypedServiceImplementation> = [];
    middlewares: Array<MiddlewareHandler> = [];

    /**
     * Constructs a server object that stores request handlers and delegates
     * incoming requests to those handlers
     * @param options Options that should be passed to the internal server implementation
     * @param preHandler Optional method to be invoked prior to the actual service handler
     * @param postHandler Optional method to be invoked after the actual service handler, and before returning the result
     * ```
     * var server = new grpc.Server();
     * server.addProtoService(protobuf_service_descriptor, service_implementation);
     * server.bind('address:port', server_credential);
     * server.start();
     * ```
     */

    constructor(options?: object, preHandler?: PreHandler, postHandler?: PostHandler) {
        super(options);
        if (preHandler) this.preHandler = preHandler;
        if (postHandler) this.postHandler = postHandler;
    }


    /**
     * Add a service to the server, with a corresponding implementation.
     * @param service The service descriptor
     * @param implementation Map of method names to method implementation
     * for the provided service.
     */
    addService<ImplementationType = grpc.UntypedServiceImplementation>(
        service: grpc.ServiceDefinition<ImplementationType>,
        implementation: ImplementationType,
        middleware?: MiddlewareHandler
    ): void {
        let proxies: any = {};
        for (const key in implementation) {
            proxies[key] = (call: any, callback: any) => {
                this.handler(call, callback, implementation[key], middleware);
            }
        }
        super.addService(service, proxies);
    };

    handler(call: any, callback: any, implementation: any, middleware?: MiddlewareHandler) {
        let context = {};
        let postHandlerCalled = false;
        try {
            if (this.preHandler) {
                this.preHandler(context, call);
            }
            if (middleware) {
                middleware(context, call);
            }

            implementation(call, (err: any, ...args: [any]) => {
                if (this.postHandler) {
                    postHandlerCalled = true;
                    this.postHandler(err, context, call);
                }
                callback(err, ...args);
            });
        }
        catch (err) {
            if (!postHandlerCalled && this.postHandler) {
                this.postHandler(err, context, call);
            }
            callback(err, null);    
        }

    }
}
