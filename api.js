var net = require('net')
var Events = require('events')
var { HTTP } = require('./http')

console.log('DEBUG-Version!!')

class TCPService extends Events {
  constructor({port}) {
    super()

    port = port
    let client = new net.Socket()

    client.connect(port, '0.0.0.0', () => { })

    client.on('data',   data => this.read(data))
    client.on('connect',  () => this._close = false )
    client.on('error',   err => this.emit('error', err))
    client.on('close',    () => this._close = true )

    if(process.env['DEBUG']) {
      client.on('close', ()  => console.log('tcp:client closing connection' ))
      client.on('error',  err  => console.error('service:error: ', err))
    }

    this.client = client
  }

  close() {
    console.log('manually closing service:socket') 
    this._close = true
  }

  read(data) {
    this.emit('read', data)
  }

  send(data) {
    if(!this._close)
      this.client.write(data)
  }
}

class HTTPService extends TCPService {
  constructor({port}){
    super({port})
  }

  read(data){
    let header = null

    if ( HTTP.isResponse(data) ) {
      header = HTTP.getHeader(data)
      this.emit(`http:${header.status}`, header, data)
      this.emit(`http:data`, header, data)
    }

    TCPService.prototype.read.call(this, data) // This the remainder that JS is not pure OOP.
  }
}


class TCPSocket extends Events {
  constructor({socket}) {
    super()
    this.socket = socket
    this.close = false

    let unsubscribe = (socket) =>{
      socket.removeAllListeners(['data', 'error', 'end'])
    }

    let subscribe = (socket) => {
      socket.on('connect', () => this.openStream())
      socket.on('data',  data => this.emit('read', data))
      socket.on('end',   end  =>  unsubscribe(socket) )
      socket.on('error', err  => this.emit('error', err))

      if(process.env['DEBUG']) {
        socket.on('error', err  => console.log('tcp:server error:', err))
        socket.on('close', ()   => console.log('tcp:server closing connection'))
      }
    }

    subscribe(socket)
  }

  send(data){
    if(!this.isStreamClosed())
      this.socket.write(data)
  }

  respond(data){
    this.socket.end(data)
    this.stopStream()
  }

  isStreamClosed(){
    return this.close
  }

  stopStream(){
    this.close = true
  }
}

class HTTPSocket extends TCPSocket {
  constructor({socket}){
    super({socket})

    let read_chunks = (data) => {
      if(HTTP.isRequest(data))
        this.emit('http:data', HTTP.getRequest(data), data)
    }

    socket.on('data',  data => read_chunks(data))
  }
}

function HTTPServer({port, handler}) {
  port = port
  net.createServer( (socket)  => {
    handler( new HTTPSocket({socket}) )
  }).listen(port)
}

function Server({port, handler}) {
  port = port
  net.createServer( (socket)  => {
    handler( new TCPSocket({socket}) )
  }).listen(port)
}

module.exports = {TCPService, HTTPService, HTTPServer, Server}
