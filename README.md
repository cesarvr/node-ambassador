# Ambassadors Containers

![](https://github.com/cesarvr/hugo-blog/blob/master/static/istio-2/ambassador.png)

It just a container that sits in front of a service another service to add new features or to enhance existing ones, this is part of [design patterns for container-based distributed systems](https://ai.google/research/pubs/pub45406) if you want to learn how to do it Kubernetes/OpenShift just take a look a this [blog post](https://cesarvr.io/post/istio-2/).

## Node-Ambassador

Its just an API that facilitate the communication between the traffic coming to the service and the traffic going from the service to the client that made the call. You can think of it as a easy library to create proxy servers.

This library has two classes.

- The Server class: To proxy any information you first need to receive information.
- The Service class: Helps to manipulate the service I/O.


## Installation

```sh
  npm install node-ambassador --save
```



## Creating a Proxy

![](https://raw.githubusercontent.com/cesarvr/hugo-blog/master/static/istio-2/relationship-objects.png)

We just need to connect the two classes, and we got a full proxy.

```js
let { Service, Server } =  require('node-ambassador')

function handleConnection(server) {
  let service = new Service({port: process.env['PORT'] || 8087})

  server.on('server:traffic', incomingData => service.send(incomingData))
  service.on('service:response:all', (status, response) => server.respond(response) )
}

new Server({port: 8080, handler: handleConnection})
console.log('Listening for request in 8080!!')
```


## How To Override A Response

Let's say you want to change the response coming from a service, let's say you want to change the message of the 404 status.

First you write or load the page:


```js

const HTTP404 = `
HTTP/1.0 404 File not found
Server: AmbassadorServer 💥
Date: ${Date()}
Content-Type: text/html
Connection: close

<body>
  <H1>Endpoint Not Found</H1>
  <img src="https://www.wykop.pl/cdn/c3201142/comment_E6icBQJrg2RCWMVsTm4mA3XdC9yQKIjM.gif">
</body>`
```

You detect the response header of the service and send the response.

## API

### Server

This constructor creates a new TCP server.

```js
  new Server({port, handler: (connection)=> {} })
```
- constructor({port, handler})  
  - The constructor initiate a new TCP server by specifying the port, and an anonymous function to handle a new connection.

#### Connection

Takes care of handling the I/O for clients connected to the server.

###### Methods

```js
httpConnection.send(data)
```

Sends data and keep the connection open, its equivalent to [socket.write](https://nodejs.org/api/net.html#net_socket_write_data_encoding_callback).


```js
  httpConnection.respond(data)
```
Sends data and keep and close the connection, its equivalent to [socket.end](https://nodejs.org/api/net.html#net_socket_end_data_encoding_callback).

##### Events

```js
httpConnection.on('server:read',  data => {})
```
Triggered when new data coming to the socket.


### HTTPServer

This constructor creates a new HTTP type of server.

```js
  new HTTPServer({port, handler: (httpConnection)=> {} })
```

- constructor({port, handler})  
  - The constructor initiate a new HTTP server by specifying the port, and an anonymous function to handle a new connection.


##### HTTPConnection

Similar to connection but it add helper function to detect HTTP headers.

###### Methods

```js
httpConnection.send(data)
```

Sends data and keep the connection open, its equivalent to [socket.write](https://nodejs.org/api/net.html#net_socket_write_data_encoding_callback).


```js
  httpConnection.respond(data)
```
Sends data and keep and close the connection, its equivalent to [socket.end](https://nodejs.org/api/net.html#net_socket_end_data_encoding_callback).



##### Events

```js
httpConnection.on('server:read',  data => {})
```

Triggered when new data coming to the socket.


```js
 server.on('server:http:headers', (header, data) =>{})
```

Triggered when a new HTTP request is detected.

- header: an object with the HTTP request headers
