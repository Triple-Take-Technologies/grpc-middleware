# grpc-middleware

Not really a middleware provider, but plays in a similar space.  Enables you to optionally define a prehook function and/or a posthook function which will get processed by a grpc server for every grpc call.  Use cases include features like authentication and logging.

Future plans call for making this handle middleware functions more in line with the way [express](https://github.com/expressjs/express) does.  Meant to be a stopgap until Interceptors get implemented, but who knows what the future will bring!

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
function preHook(context, request) {
    console.log('I get called every time before the target function!');
}
```
`context` will be an empty Object.  It should be used for passing any data desired for use by the `postHandler`.  For example:
```javascript
    context.userId = 1234;
```
`request` is the object provided by the underlying grpc framework (commonly referred to as `call` in the official documentation).

#### postHandler
If provided, `postHandler` must be a function similar to the following:
```javascript
function postHook(err, context, request) {
    console.log('I get called every time after the target function!');
}
```
If the `preHandler` throws an error, or the target function calls its `callback` function passing in an error object, that error will be provided to th `postHandler` as `err`.  Otherwise, `err` will be `null`.

`context` will be the `context` object populated by the `preHandler`.  If there is no `preHandler`, it will be an empty Object.

`request` is the object provided by the underlying grpc framework (commonly referred to as `call` in the official documentation), updated with any changes caused by the `preHandler` and/or target function.

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

## License
[MIT](LICENSE)