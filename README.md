# Ambassadors Containers


[The Ambassador pattern](https://ai.google/research/pubs/pub45406), is a way to configure containers where one container the ambassador proxy communication to and from a main container, the ambassador can be designed to encapsulate features that enhance the main container. For example, you have a service making calls to some other service, but now that "other" service requires some authentication, you can develop an ambassador container that handle that new feature and keep the original service agnostic of security protocols. The key point is to encapsulate reusable behaviour inside a container and then plug and play this behaviour on demand taking advantage of platforms like Kubernetes/OpenShift. 

If you want more example take a look a [this post](https://cesarvr.io/post/istio-2/).

![](https://github.com/cesarvr/hugo-blog/blob/master/static/istio-2/ambassador.png)

## Node-Ambassador

Its just an API that facilitate the communication between the traffic coming to the service and the traffic going from the service to the client that made the call. You can think of it as a easy library to create and manipulate proxy servers.

## Installation

```sh
  npm install node-ambassador --save
```



## Creating a Proxy

![](https://raw.githubusercontent.com/cesarvr/hugo-blog/master/static/istio-2/relationship-objects.png)

We just need to connect the two classes, and we got a full proxy.

```js
  function handleConnection(server) {
    let target_port = process.env['TARGET_PORT'] || 8087
    console.log(`Target port: ${target_port}`)
    let service = new HTTPService({port: target_port })

    // Tunnel
    server.on( 'server:read',  data => service.send(data)   )
    service.on('service:read', data => server.send(data)    )
  }


  let port = process.env['PORT'] || 8080
  new HTTPServer({port, handler: handleConnection})
  console.log(`Listening for request in ${port}`)```
```

## How To Override A Response

Let's say you want to change the response coming from a service, let's say you want to change the default message of the 404 status.

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

```js

const HTTP404 = `...`
function handleConnection(server) {
  /*...*/
  let service = new HTTPService({port: target_port })

  service.on('service:http:404', (header, response) => server.respond(HTTP404) ) 

  // Tunnel
  server.on( 'server:read',  data => service.send(data)   )
  service.on('service:read', data => server.send(data)    )
}

/*...server initialization...*/
```

Here is an example of overriding the response of a [Wildfly Java](https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=1&cad=rja&uact=8&ved=2ahUKEwjo1fqdg-PeAhUHLVAKHV0OCk8QFjAAegQIChAB&url=http%3A%2F%2Fwildfly.org%2F&usg=AOvVaw0_um9NB2aqGeJRcMk6CPHb) micro-service.

![](https://raw.githubusercontent.com/cesarvr/ambassador/master/assets/final.gif)

### More Ideas

Other example, imagine you want to be notified if a server crash with an HTTP 500.

```js
  service.on('service:http:500', (header, response) => send_email_to_me ) 
```

Another, imagine you want to test create a reusable container that intercepts and validates requests.

```js
  server.on('service:read', (response) => OAuth.check_token() ) 
  OAuth.on('token:invalid', (err_code)=> server.send(HTML(err_code)) )

  /*if valid send just handover the service response*/
```

## API

### Server

This constructor creates a new TCP server.

```js
  new Server({port, handler: (connection)=> {} })
```
Syntax: 
```js
constructor({port, handler}) 
```
  - The constructor initiate a new TCP server by specifying the port, and an anonymous function to handle a new connection.

#### Connection

Takes care of handling the I/O for clients connected to the server.

###### Methods

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
Syntax: 
```js
  constructor({port, handler})
```
  - The constructor initiate a new HTTP server by specifying the port, and an anonymous function to handle a new connection.


##### HTTPConnection

Similar to connection but it add helper function to detect HTTP headers.

###### Methods

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
