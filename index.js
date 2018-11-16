var net = require('net')
var Events = require('events')

let HTTP = Object.create({
  getStatus: function(data){
    let headerFirstLine = data.toString().split('\n')[0]
    let status = headerFirstLine.split(' ')[1].trim()
    return status
  }
})

class Service extends Events {
  constructor({port}) {
    super()

    port = port || 8080
    let client = new net.Socket()

    client.connect(port, '0.0.0.0', () => {
      console.log(`connected to ${port}`)
    })

    client.on('data',  data => this.read(data))
    client.on('end',   data  => this.finish(data))
    client.on('error', err => this.emit('service:error', err))

    this.client = client
    this.buffer = []
  }

  send(data) {
    this.client.write(data)
  }

  read(data){
    this.buffer.push(data)
  }

  finish(){
    let status = HTTP.getStatus(this.buffer[0])
    this.emit(`service:response:${status}`, this.buffer)
    this.emit(`service:response:all`, [status, this.buffer])
  }
}

class ServerSocket extends Events {
  constructor({socket}) {
    super()
    this.buffer = null
    this.socket = socket

    let unsubscribe = (socket) =>{
        socket.removeAllListeners(['data', 'error', 'end'])
    }

    let subscribe = (socket) => {
      socket.on('data',  data => this.emit('server:traffic', data))
      socket.on('error', err => this.emit('server:error', err))
      socket.on('end',   end => unsubscribe(socket) )
    }

    subscribe(socket)
 }

  respond(chunks){
    if(Array.isArray(chunks))
      chunks.forEach(data => this.socket.write(data) )

    this.socket.end() //close socket connection
  }
}


function Server({port, handler}) {
    port = port || 8080
    net.createServer( (socket)  => {
      handler( new ServerSocket({socket}) )
    }).listen(port)
}


module.exports = {Service, Server}
