# title
Building a Socket.IO Gateway with standard NestJS architecture

# description
Set up ChatGateway and ChatService to receive, save to PostgreSQL, and broadcast realtime messages, mastering @WebSocketGateway and @SubscribeMessage.

# body

## 1. Goal

In this challenge, you will build a complete **Socket.IO Gateway** yourself. Instead of just a simple ping/pong, you will apply the standard NestJS architecture:
- Create `ChatGateway` to handle connections, process join room logic via the `joinRoom` event, and listen to the `chatToServer` event.
- Send data to `ChatService` to execute an Insert command into PostgreSQL via `TypeOrmModule`.
- After successfully saving, use Socket.IO's `Server` object to broadcast the `chatToClient` event, delivering the latest message data exclusively to clients **in the same room**.

This is the core foundation for any Chat App, Notification, or Live Tracking application.

## 2. Instructions

### 2.1. System Requirements

1. Initialize `ChatGateway` listening on the application's default port (Port 3000).
2. Create the `chat_message` table via the `ChatMessage` Entity with the fields `id`, `senderId`, `nickname`, `room`, `text`, `createdAt`.
3. Receive the `joinRoom` event to handle assigning `client.data.room` and calling `client.join(room)`.
4. Upon receiving the `chatToServer` event with the payload `{ room: string, text: string }`, the Gateway checks `client.data` and calls `ChatService` to save the record to the PostgreSQL database.
5. Immediately after saving, the Gateway emits the `chatToClient` event containing the exact message information just saved to the entire network **but restricted solely to that specific room (broadcast to room)**.
6. Use a static HTML client interface (open 2 browser tabs using **Live Server**) to test the join room process and sending/receiving messages between 2 users.

### 2.2. Structure Hints

You should refer to the sample source code to set up the architecture. Suggested diagram:

```text
src/
 ├── modules/
 │    └── chat/
 │         ├── chat.module.ts
 │         ├── chat.gateway.ts
 │         ├── chat.service.ts
 │         ├── entities/
 │         │    └── chat-message.entity.ts
 │         └── dto/
 │              └── chat-message.dto.ts
 ├── app.module.ts (contains TypeOrmModule.forRoot)
 └── main.ts
```

- **Step 1**: Declare the `ChatMessage` entity and integrate `TypeOrmModule` into the application (remember to run the PostgreSQL container).
- **Step 2**: Declare the `ChatGateway` class and use `@WebSocketGateway()`. Don't forget to declare it as a provider in `ChatModule`.
- **Step 3**: Inside `ChatGateway`, use the `@WebSocketServer()` decorator to inject Socket.IO's `Server` object.
- **Step 4**: Create a `handleJoinRoom` method decorated with `@SubscribeMessage('joinRoom')` to assign `client.join(room)`.
- **Step 5**: Create a method (e.g., `handleChat`) decorated with `@SubscribeMessage('chatToServer')`.
- **Step 6**: Inside `handleChat`, call `ChatService.saveMessage(...)`, then call `this.server.to(session.room).emit('chatToClient', savedMessage)` to broadcast specifically to the room.

## 3. Completion

You have grasped how to integrate a database into a realtime system.
If you only broadcast in-memory, messages will be lost when the server restarts. Calling a **Service** to save to **PostgreSQL** ensures data persistence.

Simultaneously, you also see the power of separation of concerns: the **Gateway** solely handles receiving and sending events, while the **Service** takes charge of communicating with the Database.

**However, there is a severe security flaw in this challenge:** Allowing the client to send a `senderId` in the `chatToServer` payload is extremely dangerous. A hacker could use Postman or modify the client JS code to send someone else's `senderId` (e.g., an Admin's), leading to identity spoofing. 

To solve this problem, move on to the next lesson: **Socket Authentication at the Handshake Layer with JWT**, where you will mandate extracting the sender's identity from the server via a Token instead of trusting the client.
