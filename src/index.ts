import grpc from 'grpc';

interface PreHandler {
    // (source: string, subString: string): boolean;
}
interface PostHandler {
    
}

export class Server extends grpc.Server {
    preHandler? : PreHandler;
    postHandler? : PostHandler;
    services : Array<grpc.UntypedServiceImplementation> = [];

    /**
     * Constructs a server object that stores request handlers and delegates
     * incoming requests to those handlers
     * @param options Options that should be passed to the internal server
     *     implementation
     * ```
     * var server = new grpc.Server();
     * server.addProtoService(protobuf_service_descriptor, service_implementation);
     * server.bind('address:port', server_credential);
     * server.start();
     * ```
     */

    constructor(options?: object, preHandler? : PreHandler, postHandler? : PostHandler)
    {
        super(options);
        this.preHandler = preHandler;
        this.postHandler = postHandler;
    }

    /**
     * Add a service to the server, with a corresponding implementation.
     * @param service The service descriptor
     * @param implementation Map of method names to method implementation
     * for the provided service.
     */
    addService<ImplementationType = grpc.UntypedServiceImplementation>(
        service: grpc.ServiceDefinition<ImplementationType>,
        implementation: ImplementationType
      ): void {
        //   super.addService(service, implementation);
        // Object.getOwnPropertyNames(implementation).forEach(
        //     (val, idx, array) => {
        //     //   console.log(val + ' -> ' + implementation[val]);
        //         // this.services[val] = implementation[val];
        // }
        //   );

        let proxies : any = {};
        for (const key in implementation) {
            proxies[key] = (call : any, callback : any) => {
                this.handler(call, callback, implementation[key]);
            }
        }
    };

    handler(call : any, callback : any, target : any) {
        // TODO: implement, deal with returns/errors/etc.  All that stuff.

        if (this.preHandler) {
            console.log('calling preHandler');
        }

        target(call, callback);

        if (this.postHandler) {
            console.log('calling postHandler');
        }
    }
}
