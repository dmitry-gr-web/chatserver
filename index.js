import { WebSocketServer } from 'ws'
import { getTransactionInfo } from './transaction.js'

function startServer() {
  const rooms = {}
  const webSocketServer = new WebSocketServer({
    port: 8081
  })
  console.log('server start')
  webSocketServer.on('connection', function (ws) {
    let currentRoom = null
    ws.on('message', function (message) {
      message = JSON.parse(message)
      const { action, room, text, userName } = message
      currentRoom = room
      switch (action) {
        case 'joinRoom':
          joinRoom(action, ws, userName, room)
          break
        case 'sendMessage':
          sendMessage(action, ws, text, room, userName)
          break
        case 'exitRoom':
          leaveRoom(action, ws, userName, room)
        default:
          break
      }
    })

    ws.on('close', function () {
      Object.keys(rooms).forEach((room) => {
        rooms[room].participants = rooms[room].participants.filter(
          (client) => client.ws !== ws
        )
        if (rooms[room].participants.length === 0) {
          delete rooms[room]
        }
      })
      if (rooms[currentRoom]) {
        rooms[currentRoom].participants.forEach((client) => {
          client.ws.send(
            JSON.stringify({
              action: 'exitRoom',
              usersLength: rooms[currentRoom].participants.length
            })
          )
        })
      }
      console.log('conection close')
    })
  })

  function joinRoom(action, ws, name, room) {
    console.log('create room')
    if (!rooms[room]) {
      rooms[room] = { participants: [], history: [] }
    }
    // add user to room
    rooms[room].participants.push({ name, ws, color: generateColor() })
    // send history to user
    rooms[room].history.forEach((msg) => {
      ws.send(JSON.stringify(msg))
    })
    console.log(  rooms[room] )
    console.log({room} )
    const clients = rooms[room].participants
    clients.forEach((client) => {
      client.ws.send(
        JSON.stringify({
          action,
          userName: name,
          usersLength: rooms[room].participants.length
        })
      )
    })
  }
  async function sendMessage(action, sender, message, room, name) {
    const clients = rooms[room].participants
    let transactionInfo = null
    if (clients) {
      const regex = /(0x)?[0-9a-fA-F]{64}/
      const match = message.match(regex)
      if (match) {
        const txid = match[0]
        console.log('find Hash', txid)
        const transaction = await getTransactionInfo(txid)
        transactionInfo = transaction
      }
      const findColor = clients.find((client) => client.ws === sender).color
      // add history cash
      rooms[room].history.push({
        userName: name,
        text: message,
        action: 'history',
        color: findColor,
        transactionInfo
      })
      // send message
      clients.forEach((client) => {
        client.ws.send(
          JSON.stringify({
            action,
            userName: name,
            text: message,
            color: findColor,
            transactionInfo
          })
        )
      })
    }
  }
  function leaveRoom(action, ws, name, room) {
    //del users from room
    rooms[room].participants = rooms[room].participants.filter((client) => client.ws !== ws)
    rooms[room].participants.forEach((client) => {
      client.ws.send(
        JSON.stringify({ action, usersLength: rooms[room].participants.length, userName: name })
      )
    })
    //del room
    console.log({room})
    if (rooms[room].participants.length === 0) {
      console.log('del room')
      delete rooms[room]
    }
  }

  const generateColor = () => {
    let randomColorString = '#'
    const arrayOfColorFunctions = '0123456789abcdef'
    for (let x = 0; x < 6; x++) {
      let index = Math.floor(Math.random() * 16)
      let value = arrayOfColorFunctions[index]
      randomColorString += value
    }
    return randomColorString
  }
}

startServer()
