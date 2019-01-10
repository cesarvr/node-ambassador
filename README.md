# Ambassadors Containers


[The Ambassador pattern](https://ai.google/research/pubs/pub45406), is a way to configure containers where one container (the ambassador), proxy communication to and from a main container. The container in the role of Ambassador can be designed to encapsulate features that we want to share with the main container. This technique is widely use by service mesh frameworks like Istio, Linkerd, etc.

## What should I care ?

For example, you have two service where **A** fetch some information of **B**, let say that the team in charge of service **B** decide to implement a brand new Authentication protocol, this leave you with two options hardcode this authentication knowledge into service **A** or encapsulate this knowledge into an **Ambassador** container that will handle this on behalf of service **A**. 

The advantage is that you can upgrade any service that want to use this aunthentication by just configuring and deploying this **Ambassador** in the same pod.

For more information take a look at [this post](https://cesarvr.io/post/istio-2/).

![](https://github.com/cesarvr/hugo-blog/blob/master/static/istio-2/ambassador.png)


## Any Example ??

Here I just encapsulate some telemetry logic into an **Ambassador** container using Node.JS, then I just reuse this container to gather telemetry of any container.

![](https://raw.githubusercontent.com/cesarvr/hugo-blog/master/static/istion-3/dashboard.gif)



## Node-Ambassador

I just create this API that easy the development of this type of container. 

## Installation

```sh
  npm install node-ambassador --save
```

## Usage  


Creating a simple Proxy server.

![](https://raw.githubusercontent.com/cesarvr/hugo-blog/master/static/istio-2/relationship-objects.png)

```js

let { Ambassador }  = require('../node-ambassador/')

const TARGET = process.env['TARGET_PORT'] || 8087
const PORT   = process.env['PORT'] || 8080

new Ambassador({port: PORT, target: TARGET}).tunnel({})

console.log(`Listening for request in ${PORT} and targeting ${TARGET}`)

```



![](https://github.com/cesarvr/hugo-blog/blob/master/static/istio-2/proxy-v1.gif)

## How To Override A Response

Let's say you want to change the response coming from a service by changing the default HTTP 404 status message.


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
let { ambassador }  = require('../node-ambassador/')
const http404 = `...`

const TARGET = process.env['TARGET_PORT'] || 8087
const PORT   = process.env['PORT'] || 8080

function override_404({service, server}) {
  service.on('http:404', () => console.log('404 Detected!'))
  service.on('http:404', () => server.respond(HTTP404))
}

new Ambassador({port: PORT, target: TARGET})
      .tunnel({ override_404 })
```

Here is an example of overriding the response of a [Wildfly Java](https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=1&cad=rja&uact=8&ved=2ahUKEwjo1fqdg-PeAhUHLVAKHV0OCk8QFjAAegQIChAB&url=http%3A%2F%2Fwildfly.org%2F&usg=AOvVaw0_um9NB2aqGeJRcMk6CPHb) micro-service.

![](https://raw.githubusercontent.com/cesarvr/ambassador/master/assets/final.gif)

### More Ideas

Other example, imagine you want to be notified if a server crash with an HTTP 500.

```js

function ret500({service}) {
    service.on('http:404', () => send_mail_to() )
}

new Ambassador({port: PORT, target: TARGET})
      .tunnel({ ret500 })
```

You want to test create a reusable container that intercepts and validates requests.

```js
let { ambassador }  = require('../node-ambassador/')

const target = process.env['target_port'] || 8087
const port   = process.env['port'] || 8080

function ret500({service}) { /*...*/ }
function Auth({ server }) {
  service.on('http:data', (header, rawHTTP) => check_token(rawHTTP))
}

new Ambassador({port: PORT, target: TARGET})
      .tunnel({ ret500, Auth })
```

## API

### Ambassador

The constructor takes two parameters:

```js
  new Ambassador({port: PORT, target: TARGET})
```
 - port: port number for listening incoming traffic.
 - target: port of the main container.

#### tunnel

This method orchestrate a proxy between incoming traffic and the main container.

 ```js
   ambassador.tunnel({ subscriber, ... })
 ```
  - **empty:** If leave empty it will create a simple proxy.

**Response** Methods:

  - **listen:** Listen for the response from the service.
  - **override:** Stops the normal flow of communication in the proxy and replace the response with a custom one.

**Request** Methods:

  - **listen:** Listen for the data coming to the container.
  - **server:** *Coming soon*.
