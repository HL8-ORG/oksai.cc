/**
 * WebSocket 集成示例
 * 展示如何在 WebSocket 网关中使用认证
 */

import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Session } from '@oksai/nestjs-better-auth';

@WebSocketGateway({
  cors: {
    origin: '*', // 生产环境应配置正确的源
  },
})
export class EventsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  // 连接时验证认证
  handleConnection(client: Socket) {
    // 认证信息会自动从 handshake.headers 中提取
    // 如果认证失败，AuthGuard 会抛出错误
    console.log(`客户端已连接: ${client.id}`);
  }

  // 需要认证的事件
  @SubscribeMessage('message')
  async handleMessage(@Session() session: any, payload: { text: string }) {
    console.log(`用户 ${session.user.name} 发送消息: ${payload.text}`);

    // 广播消息给所有客户端
    this.server.emit('message', {
      user: session.user.name,
      text: payload.text,
      timestamp: new Date(),
    });
  }

  // 获取在线用户列表 - 需要认证
  @SubscribeMessage('getUsers')
  async handleGetUsers(@Session() session: any) {
    // 返回在线用户列表
    return {
      users: [], // 实际应用中应从某个服务中获取
    };
  }

  // 可选认证 - 游客也可以访问
  @SubscribeMessage('ping')
  @OptionalAuth()
  async handlePing(@Session() session: any) {
    if (session) {
      return { pong: true, user: session.user.name };
    }
    return { pong: true, user: 'guest' };
  }
}

/**
 * 客户端连接示例 (JavaScript)
 */

const clientCode = `
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  transportOptions: {
    polling: {
      extraHeaders: {
        // 传递认证 cookie
        Cookie: 'better-auth.session_token=YOUR_TOKEN'
      }
    }
  }
});

socket.on('connect', () => {
  console.log('已连接到服务器');
  
  // 发送消息
  socket.emit('message', { text: 'Hello!' });
});

socket.on('message', (data) => {
  console.log('收到消息:', data);
});
`;

/**
 * 模块配置
 */

import { Module } from '@nestjs/common';
import { AuthModule } from '@oksai/nestjs-better-auth';

@Module({
  imports: [
    AuthModule.forRoot({
      auth: betterAuth({
        database: {
          /* ... */
        },
      }),
    }),
  ],
  providers: [EventsGateway],
})
export class AppModule {}
