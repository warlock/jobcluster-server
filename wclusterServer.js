const express = require('express')
const app = express()
const cors = require('cors')
app.use(cors())
const ioserver = require('http').Server(app)
const io = require('socket.io')(ioserver)
ioserver.listen(3000)
app.use(express.static('dist'))

var clients = []
var jobs = [{ worker: 25, word: 'barcelona' }, { worker: 25, word: 'girona' }, { worker: 26, word: 'madrid' }]

setInterval(() => {
  const servers_available = clients.filter(servercheck => servercheck.free && servercheck.wait < Date.now())
  if (jobs.length > 0) {
    //console.log(`JOBS: ${jobs.length} - CLIENTS: ${servers_available.length}/${clients.length}`)
    for (const fresh_server of servers_available) {
      if (jobs.length === 0) return 0
      clients[clients.findIndex(c => c.id === fresh_server.id)].free = false
      clients[clients.findIndex(c => c.id === fresh_server.id)].job = jobs.pop()
      clients[clients.findIndex(c => c.id === fresh_server.id)].running_job = Date.now()
      io.to(fresh_server.id).emit('job', clients[clients.findIndex(client => client.id === fresh_server.id)].job)
    }
    //} else console.log(`JOBS: 0 - CLIENTS: ${clients.length}/${clients.length}`)
  }
  io.emit('stats', { clients, jobs })
}, 3000)

io.on('connection', socket => {
  console.log(`CONECTAT: ${socket.id}`)

  socket.on('new', data => {
    console.log(`NEW CLIENT: ${socket.id} : ${JSON.stringify(data)}`)
    clients.push({ id: socket.id, wait: 0, free: true, running_job: 0, job: {}, ...data })
  })

  socket.on('work_end', () => {
    clients[clients.findIndex(server_find => server_find.id === socket.id)].wait = Date.now() + 60000
    clients[clients.findIndex(server_find => server_find.id === socket.id)].free = false
    clients[clients.findIndex(server_find => server_find.id === socket.id)].running_job = 0
    clients[clients.findIndex(server_find => server_find.id === socket.id)].job = {}
  })

  socket.on('life', data => {
    clients[clients.findIndex(server_find => server_find.id === socket.id)].uptime = data.uptime
    clients[clients.findIndex(server_find => server_find.id === socket.id)].freemem = data.freemem
    clients[clients.findIndex(server_find => server_find.id === socket.id)].totalmem = data.totalmem
  })

  socket.on('disconnect', () => {
    const client = clients.find(server_find => server_find.id === socket.id)
    if (client) {
      jobs.push(client.job)
      clients = clients.filter(server_find => server_find.id !== socket.id)
    }
    console.log(`DESCONECTAT: ${socket.id}`)
    //ALERTA AMB LES DESCONEXIONS... HEM DE TORNAR A RECUPERAR TOTS ELS JOBS PENDENTS
  })
})

// ALERTA AMB LES APAGADES DE SOFTWARE
