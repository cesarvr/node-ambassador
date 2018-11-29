

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


module.exports = {HTTP}
