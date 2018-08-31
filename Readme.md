# grpc-middleware

Not a full-fledged middleware provider, but plays in a similar space.  Enables you to optionally define a prehook function and/or a posthook function, which will get processed by a grpc server for every grpc call.  Also allows specification of a per-service or per-function middleware function.  Use cases can include features like authentication and logging.

Meant to be a stopgap until Interceptors get implemented, but who knows what the future will bring!

Designed as a drop-in replacement for [grpc](https://github.com/grpc/grpc-node).

## Installation

This is a [Node.js](https://nodejs.org/en/) module available through the
[npm registry](https://www.npmjs.com/).

Installation is done via `npm`:
```bash
$ npm install grpc-middleware
```

## Usage

Build your [grpc](https://grpc.io) server software as usual.  However, instead of a line like:
```javascript
const grpc = require('grpc');
```
use a line like:
```javascript
const grpc = require('grpc-middleware');
```
Without any other changes, everything will work as expected.  This is what is meant by  "Designed as a drop-in replacement".

### grpc.Server
The call to `grpc.Server` can now take up to two additional arguments.

```javascript
const server = new grpc.Server(options, preHandler, postHandler);
```
`options` is passed through to the underlying grpc Server handler.  Note that the arguments are positional, so if later parameters are desired to be passed, `null` must be passed in place of the earlier parameters.

#### preHandler
If provided, `preHandler` must be a function similar to the following:
```javascript
function preHook(context, call) {
    console.log('I get called every time before the target function!');
}
```
`context` will be an empty Object.  It should be used for passing any data desired for use by the `postHandler`.  For example:
```javascript
    context.userId = 1234;
```
`call` is the object provided by the underlying grpc framework.

#### postHandler
If provided, `postHandler` must be a function similar to the following:
```javascript
function postHook(err, context, call) {
    console.log('I get called every time after the target function!');
}
```
If the `preHandler` or the middleware function throws an error, or the target function calls its `callback` function passing in an error object, that error will be provided to the `postHandler` as `err`.  Otherwise, `err` will be `null`.

`context` will be the `context` object populated by the `preHandler` and/or middleware.  If there is no `preHandler` and/or middleware, it will be an empty Object.

`call` is the object provided by the underlying grpc framework, updated with any changes caused by the `preHandler`, the middleware, and/or target function.

### grpc.Server.addService
`addService` can accept a third, optional parameter, `middleware`. `middleware` can either be a function or a mapping of function names to middleware implementation functions.  If `middleware` is a function, it must be similar to the following:
```javascript
function middleware(context, call) {
    console.log('in middleware');
}
```
In this case, `context` will be the object populated by the `preHandler`.  If there is no `preHandler`, it will be an empty Object.

`call` is the object provided by the underlying grpc framework, updated with any changes caused by the `preHandler`.

Alternatively, `middleware` can be a mapping of function names to implementation functions, just as with `implementation`. By specifying a key of the same name as passed to `implementation`, a per-function middleware can be specified.  For example:
```javascript
server.addService(hello_proto.Greeter.service, { sayHello: sayHello }, { sayHello : middleware });
```
The target functions must have the same signature as shown above.  In this case, the middleware function will only get called for the `sayHello` function, not any other functions that the `hello_proto.Greeter.service` may support.

In all cases, the `preHandler`, if one exists, will get called before the middleware function.

## Example
```javascript
const PROTO_PATH = './protos/helloworld.proto';
const grpc = require('grpc-middleware');

var protoLoader = require('@grpc/proto-loader');

var packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    });
const hello_proto = grpc.loadPackageDefinition(packageDefinition).helloworld;

function sayHello(call, callback) {
    callback(null, { message: 'Hello ' + call.request.name });
}

function preHook(context, request) {

    console.log('in prehook', request);
    console.log(context); // should be {}
    context.mytest = 'myvalue!!';
    console.log('finished prehook');
} 

function postHook(err, context, request) {
    console.log('in postHook');
    console.log(context); // should be {mytest: "myvalue!!"}
    console.log('finished posthook');
} 

const server = new grpc.Server(null, preHook, postHook);

server.addService(hello_proto.Greeter.service, { sayHello: sayHello });

var port = server.bind('0.0.0.0:50051', grpc.ServerCredentials.createInsecure());
if (port != 0) {
    console.log(`Bound to port ${port}`);
    server.start();
}
else {
    console.log(`Unable to bind to port.`);
    
}
```

## Limitations
This package has only been tested with Server/Unary calls.  It has not been tested with client streaming, server streaming, or bidirectional calls.

## License
[MIT](LICENSE)