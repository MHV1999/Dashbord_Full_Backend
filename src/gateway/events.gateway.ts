import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  emitToProject(projectId: string, event: string, data: any) {
    this.server.to(`project:${projectId}`).emit(event, data);
  }

  @SubscribeMessage('joinProject')
  handleJoinProject(@MessageBody() data: { projectId: string }) {
    // In a real app, you'd get client from context and join room
    // For now, just return
    return { event: 'joined', data: { projectId: data.projectId } };
  }
}