import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingInterval: 10000,
  pingTimeout: 5000
});

const PORT = process.env.PORT || 4000;

// In-Memory Rooms State
// Room structure:
// {
//   id: string (e.g. 'BAGAN-7X2A'),
//   host: { id, name, faction: 'player' },
//   guest: { id, name, faction: 'enemy' } | null,
//   status: 'waiting' | 'in_game' | 'finished',
//   mapSeed: number,
//   createdAt: number
// }
const rooms = new Map();
let quickMatchQueue = null; // Socket waiting for 1v1 match

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'BAGAN-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    game: 'First Empires: Bagan Multiplayer Engine',
    activeRooms: rooms.size,
    inQueue: quickMatchQueue ? 1 : 0
  });
});

io.on('connection', (socket) => {
  console.log(`[Socket Connected] ID: ${socket.id}`);
  let currentRoomId = null;

  // 1. Create Room
  socket.on('create-room', ({ playerName = 'မင်းလောင်း (Bagan Lord)' }) => {
    // Leave previous room if any
    if (currentRoomId) leaveRoom(socket, currentRoomId);

    const roomId = generateRoomCode();
    const room = {
      id: roomId,
      host: { id: socket.id, name: playerName, faction: 'player' },
      guest: null,
      status: 'waiting',
      mapSeed: Math.floor(Math.random() * 1000000),
      createdAt: Date.now()
    };

    rooms.set(roomId, room);
    socket.join(roomId);
    currentRoomId = roomId;

    socket.emit('room-created', {
      roomId,
      role: 'host',
      faction: 'player',
      room
    });

    console.log(`[Room Created] ${roomId} by ${playerName} (${socket.id})`);
  });

  // 2. Join Room by Code
  socket.on('join-room', ({ roomId, playerName = 'ပြိုင်ဘက်မင်း (Rival Lord)' }) => {
    const formattedId = (roomId || '').trim().toUpperCase();
    const room = rooms.get(formattedId);

    if (!room) {
      socket.emit('join-error', { message: 'အခန်းကုဒ် မမှန်ကန်ပါ (Room Not Found)!' });
      return;
    }

    if (room.guest || room.status !== 'waiting') {
      socket.emit('join-error', { message: 'ဤအခန်းတွင် ကစားသမားပြည့်နေပါပြီ (Room Full)!' });
      return;
    }

    room.guest = { id: socket.id, name: playerName, faction: 'enemy' };
    room.status = 'in_game';
    socket.join(formattedId);
    currentRoomId = formattedId;

    console.log(`[Player Joined] ${playerName} joined ${formattedId}`);

    // Notify guest
    socket.emit('room-joined', {
      roomId: formattedId,
      role: 'guest',
      faction: 'enemy',
      room
    });

    // Notify host that guest joined
    io.to(room.host.id).emit('guest-joined', {
      guest: room.guest,
      room
    });

    // Start Battle for both
    setTimeout(() => {
      io.to(formattedId).emit('battle-start', {
        roomId: formattedId,
        host: room.host,
        guest: room.guest,
        mapSeed: room.mapSeed,
        hostSpawn: { x: -32, z: 0 },
        guestSpawn: { x: 32, z: 0 }
      });
      console.log(`[Battle Started] Room: ${formattedId}`);
    }, 1500);
  });

  // 3. Quick Matchmaking (1v1)
  socket.on('quick-match', ({ playerName = 'သူရဲကောင်း (Warrior)' }) => {
    if (quickMatchQueue && quickMatchQueue.id !== socket.id && io.sockets.sockets.has(quickMatchQueue.id)) {
      // Pair with waiting player
      const opponentSocket = quickMatchQueue;
      quickMatchQueue = null;

      const roomId = generateRoomCode();
      const room = {
        id: roomId,
        host: { id: opponentSocket.id, name: opponentSocket.data?.playerName || 'မင်းလောင်း', faction: 'player' },
        guest: { id: socket.id, name: playerName, faction: 'enemy' },
        status: 'in_game',
        mapSeed: Math.floor(Math.random() * 1000000),
        createdAt: Date.now()
      };

      rooms.set(roomId, room);
      opponentSocket.join(roomId);
      socket.join(roomId);

      opponentSocket.data.currentRoomId = roomId;
      currentRoomId = roomId;

      opponentSocket.emit('room-created', {
        roomId,
        role: 'host',
        faction: 'player',
        room
      });

      socket.emit('room-joined', {
        roomId,
        role: 'guest',
        faction: 'enemy',
        room
      });

      setTimeout(() => {
        io.to(roomId).emit('battle-start', {
          roomId,
          host: room.host,
          guest: room.guest,
          mapSeed: room.mapSeed,
          hostSpawn: { x: -32, z: 0 },
          guestSpawn: { x: 32, z: 0 }
        });
        console.log(`[Quick Match Battle Started] Room: ${roomId}`);
      }, 1500);
    } else {
      // Put in queue
      socket.data = { playerName };
      quickMatchQueue = socket;
      socket.emit('matchmaking-queued', { message: 'ပြိုင်ဘက် ရှာဖွေနေပါသည်...' });
      console.log(`[Matchmaking Queue] Player: ${playerName} (${socket.id})`);
    }
  });

  socket.on('cancel-quick-match', () => {
    if (quickMatchQueue && quickMatchQueue.id === socket.id) {
      quickMatchQueue = null;
      socket.emit('matchmaking-cancelled');
    }
  });

  // ----------------------------------------------------------------
  // Real-Time In-Game Replication Events
  // ----------------------------------------------------------------

  // Building Placed
  socket.on('mp:place-building', (data) => {
    if (!currentRoomId) return;
    socket.to(currentRoomId).emit('mp:building-placed', data);
  });

  // Building Upgraded
  socket.on('mp:upgrade-building', (data) => {
    if (!currentRoomId) return;
    socket.to(currentRoomId).emit('mp:building-upgraded', data);
  });

  // Defense Tower Added to Building
  socket.on('mp:add-defense-tower', (data) => {
    if (!currentRoomId) return;
    socket.to(currentRoomId).emit('mp:defense-tower-added', data);
  });

  // Unit Trained
  socket.on('mp:train-unit', (data) => {
    if (!currentRoomId) return;
    socket.to(currentRoomId).emit('mp:unit-trained', data);
  });

  // Unit Move Command
  socket.on('mp:unit-move', (data) => {
    if (!currentRoomId) return;
    socket.to(currentRoomId).emit('mp:unit-moved', data);
  });

  // Unit Attack Command
  socket.on('mp:unit-attack', (data) => {
    if (!currentRoomId) return;
    socket.to(currentRoomId).emit('mp:unit-attacked', data);
  });

  // Hero Ability (War Cry)
  socket.on('mp:hero-war-cry', (data) => {
    if (!currentRoomId) return;
    socket.to(currentRoomId).emit('mp:hero-war-cry-triggered', data);
  });

  // Entity Took Damage
  socket.on('mp:entity-damage', (data) => {
    if (!currentRoomId) return;
    socket.to(currentRoomId).emit('mp:entity-damaged', data);
  });

  // Entity Destroyed / Died
  socket.on('mp:entity-die', (data) => {
    if (!currentRoomId) return;
    socket.to(currentRoomId).emit('mp:entity-destroyed', data);
  });

  // Tactical Chat / Emote
  socket.on('mp:chat', (data) => {
    if (!currentRoomId) return;
    io.to(currentRoomId).emit('mp:chat-message', {
      sender: socket.id,
      text: data.text,
      senderName: data.senderName
    });
  });

  // Ping / Latency
  socket.on('mp:ping', (timestamp) => {
    socket.emit('mp:pong', timestamp);
  });

  // Disconnection
  socket.on('disconnect', () => {
    console.log(`[Socket Disconnected] ID: ${socket.id}`);
    if (quickMatchQueue && quickMatchQueue.id === socket.id) {
      quickMatchQueue = null;
    }
    if (currentRoomId) {
      leaveRoom(socket, currentRoomId);
    }
  });
});

function leaveRoom(socket, roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  io.to(roomId).emit('opponent-left', {
    message: 'ပြိုင်ဘက် ကစားသမား စစ်မြေပြင်မှ ထွက်ခွာသွားပါပြီ (Opponent Forfeited)!'
  });

  rooms.delete(roomId);
  socket.leave(roomId);
  console.log(`[Room Closed] ${roomId}`);
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🏰 [Bagan Multiplayer Server] Active and listening on port ${PORT}`);
});
