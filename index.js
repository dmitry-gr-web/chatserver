import { WebSocketServer } from 'ws'
import { getTransactions, getTransactionInfo } from './transaction.js'

async function startServer() {
  const txHashArray = await getTransactions()
  //   const txHashArray = [
  //     '0x1a3f7d07bf043962f8c7a4954b89dd3244f4aa6f0889cd86f2b1851c80f2632c',
  //     '0x6af3ecf01ea618f9a2f07b65a66770f4f9aaee18cf57f3db6f769fe364fbfac0'
  //   ]
  console.log({ txHashArray })
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
        if (txHashArray.some((x) => text.includes(x))) {
          console.log('find Hash')
          const hash = txHashArray.find((x) => text.includes(x))
          const transactionInfo = await getTransactionInfo(hash)
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
