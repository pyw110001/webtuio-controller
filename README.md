WebTUIO Bridge 是一个桥接服务器，用于将前端 WebSocket 发送的数据实时转换为 OSC 消息，通过 UDP 协议传递给支持 TUIO 协议的目标软件（如多点触控应用、数字艺术平台等）。该服务实现了浏览器与本地或远程 TUIO 接收端之间的高效通信，便于多种人机交互场景的开发和测试。适用于需要用 Web 端采集或模拟触控信号、希望快速对接 TUIO 协议的开发者和创意项目。

关键特性：
- 前端可通过 WebSocket 实时发送数据
- 自动转换为 OSC/TUIO 格式后以 UDP 方式广播
- 支持多端并发连接和实时消息推送
- Python 实现，易于二次开发和自定义扩展


## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
   `pip install r requirements.txt`
2. Run the app:
   `npm run dev`
   `python server.py`
   
