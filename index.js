var net = require('net')
var Events = require('events')

console.log('DEBUG-Version!!')

let HTTP = Object.create({
  version: /HTTP\/1./, 

  getStatus: function(data){
    let headerFirstLine = data.toString().split('\n')[0]
    let status = headerFirstLine.split(' ')[1].trim()
    return status
  },

  getRequest(http_block) {
    let str = http_block.toString().split('\n')[0]

    str = str.split(' ')

    let HTTPMethod   = str[0].trim() // [ GET ] /home HTTP1.1..
    let HTTPResource = str[1].trim() // GET [ /home ] HTTP1.1..

    return { HTTPMethod, HTTPResource }
  },

  getHeader: function(data){
    let headerFirstLine = data.toString().split('\n')[0]
    let status   = headerFirstLine.split(' ')[1].trim()

    let state    = headerFirstLine.split(' ')
      .splice(2,headerFirstLine.length)
      .join(' ')
      .trim()

    return { status, state }
  },

  /* Expect a data: buffer 
   *
   * It guess the header of a particular request.
   *
   */
  isRequest: function(data){
    data = data.toString()

    if(data === undefined || data === '')
      return false
    
    return data.search(this.version) !== -1 
  },

  isResponse: function(data){
    data = data.toString()

    if(data === undefined || data === '')
      return false

    return data.search(this.version) !== -1 
  }
})

class TCPService extends Events {
  constructor({port}) {
    super()

    port = port
    let client = new net.Socket()

    client.connect(port, '0.0.0.0', () => { })

    client.on('data',  data => this.read(data))
    client.on('connect',  () => console.log(`connected: ${port}`)) 

    if(process.env['DEBUG']) { 
        client.on('error', err  => console.log('etcp:client error: ', err))
        client.on('close', ()  => console.log('tcp:client closing connection' )) 
    }

    this.client = client
  }

  send(data) {
    this.client.write(data)
  }

  read(data){
    this.emit('service:read', data)
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
      console.log('http header: ', header) 
      this.emit(`service:http:${header.status}`, header, data)
      this.emit(`service:http:headers`, header, data)
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
      socket.on('data',  data => this.emit('server:read', data))
      socket.on('end',   end  =>  unsubscribe(socket) )
      socket.on('error', err => this.emit('server:error', err))

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
        this.emit('server:http:headers', HTTP.getRequest(data), data)
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
