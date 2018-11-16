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

```js
let { Service, Server } =  require('node-ambassador')

function handleConnection(server) {
  let service = new Service({port: process.env['PORT'] || 8087})

  server.on('server:traffic', incomingData => service.send(incomingData))
  service.on('service:response:all', (status, response) => server.respond(response) )
  service.on('service:response:404', response => server.respond([HTTP404]) )
}

new Server({port: 8080, handler: handleConnection})
console.log('Listening for request in 8080!!')
```

## API 

### Server

- constructor({port, handler})  
  - The constructor initiate a new TCP server by specifying the port, and an anonymous function to handle a new connection.
  - Any new connections injects the server class that handle the I/O of the connection.

- Server.respond: accepts an array representing data chunks. 

#### Events 

- the class emits a ``server:traffic`` event any time there is new data from a connected client.

### Service

This class handle the communication with the server.   

- constructor({port}) 
  - The constructor initiated a TCP client with any service running in the local-host, to the specified **port**. 

  - Service.send: its just a wrapper over the **socket.write**. 
    
#### Events 

- ``service:response:${status}`` it emits the response of the service, classified by HTTP status. For example: 

  ```js

    service.on('service:response:200', response => all_good(response) )
    service.on('service:response:500', response => report_by_email(response) )
  ```


- ``service:response:all`` It triggers with any type of response coming from the service.















