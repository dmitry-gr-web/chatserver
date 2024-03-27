import { WebSocketServer } from 'ws'
import { getTransactionInfo } from './transaction.js'

async function startServer() {
  const rooms = {}
  const webSocketServer = new WebSocketServer({
    port: 8081
  })
  console.log('server start')
  webSocketServer.on('connection', function (ws) {
    const id = Math.random()
    let currentRoom = null
    console.log('New user ' + id)
    ws.on('message', async function (message) {
      message = JSON.parse(message)
      const { action, room, text } = message
      console.log({ message })
      if (action === 'joinRoom') {
        if (!rooms[room]) {
          rooms[room] = []
        }
        rooms[room].push(ws)
        currentRoom = room
        console.log(`Client ${id} joined room ${currentRoom}`)
        message.usersLength = rooms[currentRoom].length
        for (const client of rooms[currentRoom]) {
          client.send(JSON.stringify({ message }))
        }
      }
      if (action === 'sendMessage') {
        const regex = /(0x)?[0-9a-fA-F]{64}/
        const match = text.match(regex)
        if (match) {
          const txid = match[0]
          console.log("find Hash", txid);
          const transactionInfo = await getTransactionInfo(txid)
          message.transactionInfo = transactionInfo
        }
        for (const client of rooms[currentRoom]) {
          client.send(JSON.stringify({ message }))
        }
      }
    })

    ws.on('close', function () {
      if (currentRoom && rooms[currentRoom]) {
        rooms[currentRoom] = rooms[currentRoom].filter(
          (client) => client !== ws
        )
      }
      let message = {}
      message.usersLength = rooms[currentRoom].length
      message.action = 'exitRoom'
      for (const client of rooms[currentRoom]) {
        client.send(JSON.stringify({ message }))
      }
      console.log(`Connection closed for client ${id}`)
    })
  })
}
startServer()
