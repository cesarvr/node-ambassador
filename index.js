let { HTTPService, HTTPServer } =  require('./api')

function subscribeEvent({name, event}) {
  return function(callback) {
    event.on(name, callback)  
  }
}


class Ambassador {
  constructor({port, target}) {
    this.port = port 
    this.target_port = target 
  }

  tunnel({ subscriber }) {
    let _embassy = new HTTPServer({port: this.port, 
      handler: (server) => { 
        let service = new HTTPService({port: this.target_port })

        if(subscriber)
          subscriber({ 
            response: { 
              listen: subscribeEvent({
                        name: 'service:http:headers', 
                        event: service
                      }),
              override: (data) => { server.respond(data) }
            }, 
            request: { 
              listen: subscribeEvent({
                  name: 'server:http:headers', 
                  event: server 
                }),
              override: (data) => { throw('override: for services not implemented!')}
            }
          })

        server.on('server:read',  data => service.send(data) )
        service.on('service:read', data => server.send(data) )
      }})
  } 

}

module.exports = {Ambassador}

