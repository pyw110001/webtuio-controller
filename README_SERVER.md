# WebTUIO Bridge Server

这是一个 Python 后端服务器，用于接收前端 WebSocket 数据，将其转换为 OSC (Open Sound Control) 格式，并通过 UDP 发送给目标软件。

## 功能特性

- 接收前端 WebSocket 连接（默认端口 8080）
- 解析 JSON 格式的 OSC 消息
- 将消息编码为二进制 OSC 格式
- 通过 UDP 转发到目标地址（默认 127.0.0.1:3333）
- 支持单个消息和 Bundle 消息格式
- 支持 TUIO 1.1 协议

## 安装

1. 确保已安装 Python 3.7 或更高版本

2. 安装依赖：
```bash
pip install -r requirements.txt
```

或者直接安装：
```bash
pip install websockets
```

## 使用方法

### 基本使用

```bash
python server.py
```

这将启动服务器，使用默认配置：
- WebSocket 监听: `0.0.0.0:8080`
- UDP 目标: `127.0.0.1:3333`

### 自定义配置

```bash
python server.py --ws-host 127.0.0.1 --ws-port 8080 --udp-host 192.168.1.100 --udp-port 3333
```

### 命令行参数

- `--ws-host`: WebSocket 监听地址（默认: 0.0.0.0）
- `--ws-port`: WebSocket 监听端口（默认: 8080）
- `--udp-host`: UDP 目标地址（默认: 127.0.0.1）
- `--udp-port`: UDP 目标端口（默认: 3333）
- `--debug`: 启用调试模式，显示详细日志

### 示例

```bash
# 监听本地 8080 端口，转发到本地 3333 端口
python server.py

# 监听所有接口的 9000 端口，转发到远程服务器
python server.py --ws-port 9000 --udp-host 192.168.1.100 --udp-port 3333

# 启用调试模式
python server.py --debug
```

## 消息格式

服务器接收前端发送的 JSON 格式 OSC 消息，支持以下格式：

### 单个消息
```json
{
  "address": "/tuio/2Dcur",
  "args": ["set", 1, 0.5, 0.5, 0.0, 0.0, 0.0]
}
```

### Bundle 格式
```json
{
  "bundle": true,
  "packets": [
    {"address": "/tuio/2Dcur", "args": ["source", "WebTUIO@webclient"]},
    {"address": "/tuio/2Dcur", "args": ["set", 1, 0.5, 0.5, 0.0, 0.0, 0.0]},
    {"address": "/tuio/2Dcur", "args": ["alive", 1]},
    {"address": "/tuio/2Dcur", "args": ["fseq", 1]}
  ]
}
```

### 带时间标签的 Bundle
```json
{
  "timeTag": 1234567890,
  "packets": [
    {"address": "/tuio/2Dcur", "args": ["set", 1, 0.5, 0.5, 0.0, 0.0, 0.0]}
  ]
}
```

## 协议说明

### TUIO 协议

TUIO (Tangible User Interface Object) 是一个用于多点触控的协议，基于 OSC。标准端口为 3333。

### OSC 消息格式

服务器会将 JSON 消息编码为标准的二进制 OSC 格式：
- 地址路径（如 `/tuio/2Dcur`）
- 类型标签字符串（如 `,sifff`）
- 参数值（字符串、整数、浮点数）

## 日志

服务器会输出以下日志信息：
- 客户端连接/断开
- 消息接收和转发
- 错误和警告

使用 `--debug` 参数可以查看更详细的调试信息。

## 测试

### 使用测试客户端

项目包含一个测试客户端 `test_client.py`，可以用于测试服务器功能：

```bash
# 在一个终端启动服务器
python server.py

# 在另一个终端运行测试客户端
python test_client.py
```

测试客户端会发送几种不同类型的消息来验证服务器功能。

### 使用前端页面测试

1. 启动服务器：
```bash
python server.py
```

2. 启动前端开发服务器：
```bash
cd webtuio-controller
npm run dev
```

3. 在浏览器中打开前端页面，配置连接地址为 `127.0.0.1:8080`

4. 点击 "Start" 开始发送触摸数据

## 故障排除

1. **端口被占用**: 确保指定的端口未被其他程序使用
2. **UDP 发送失败**: 检查目标地址和端口是否正确，防火墙是否允许 UDP 通信
3. **消息格式错误**: 检查前端发送的 JSON 格式是否正确
4. **连接失败**: 确保服务器正在运行，检查防火墙设置

## 许可证

与主项目保持一致。

