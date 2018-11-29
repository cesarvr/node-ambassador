let { HTTPService, HTTPServer } =  require('./api')

class Ambassador {
  constructor({port, target}) {
    this.port = port
    this.target_port = target
  }

  tunnel(opts) {
    let _embassy = new HTTPServer({port: this.port,
      handler: (server) => {
        let service = new HTTPService({port: this.target_port })

        Object.keys(opts).forEach(key => {
          let fn = opts[key]
          if(typeof fn === 'function') 
            fn({service, server})
        })

        server.on('read',  data => service.send(data) )
        service.on('read', data =>  server.send(data) )
      }})
  }
}

module.exports = {Ambassador}
