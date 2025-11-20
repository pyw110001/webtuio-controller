#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WebTUIO Bridge Server
接收前端 WebSocket 数据，转换为 OSC 格式，通过 UDP 发送给目标软件
"""

import asyncio
import json
import socket
import struct
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

try:
    import websockets
except ImportError:
    print("错误: 请安装 websockets 库: pip install websockets")
    exit(1)

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# 默认配置
DEFAULT_WS_HOST = '0.0.0.0'  # 监听所有接口
DEFAULT_WS_PORT = 8080
DEFAULT_UDP_HOST = '127.0.0.1'
DEFAULT_UDP_PORT = 3333  # TUIO 标准端口


class OSCEncoder:
    """OSC 消息编码器"""
    
    @staticmethod
    def pad_string(s: str) -> bytes:
        """将字符串填充到 4 字节边界"""
        s_bytes = s.encode('utf-8')
        padding = (4 - (len(s_bytes) % 4)) % 4
        return s_bytes + b'\x00' * padding
    
    @staticmethod
    def encode_string(value: str) -> bytes:
        """编码字符串参数"""
        return OSCEncoder.pad_string(value)
    
    @staticmethod
    def encode_int32(value: int) -> bytes:
        """编码 32 位整数"""
        return struct.pack('>i', int(value))
    
    @staticmethod
    def encode_float32(value: float) -> bytes:
        """编码 32 位浮点数"""
        return struct.pack('>f', float(value))
    
    @staticmethod
    def encode_message(address: str, args: List[Any]) -> bytes:
        """编码 OSC 消息"""
        # 编码地址
        address_bytes = OSCEncoder.pad_string(address)
        
        # 构建类型标签字符串
        type_tags = ','
        arg_bytes = b''
        
        for arg in args:
            if isinstance(arg, str):
                type_tags += 's'
                arg_bytes += OSCEncoder.encode_string(arg)
            elif isinstance(arg, int):
                type_tags += 'i'
                arg_bytes += OSCEncoder.encode_int32(arg)
            elif isinstance(arg, float):
                type_tags += 'f'
                arg_bytes += OSCEncoder.encode_float32(arg)
            else:
                # 尝试转换其他类型
                try:
                    # 尝试转换为数字
                    if isinstance(arg, bool):
                        # 布尔值作为整数处理
                        type_tags += 'i'
                        arg_bytes += OSCEncoder.encode_int32(1 if arg else 0)
                    elif isinstance(arg, (int, float)) or (isinstance(arg, str) and arg.replace('.', '', 1).replace('-', '', 1).isdigit()):
                        # 尝试解析为数字
                        num = float(arg)
                        if num.is_integer():
                            type_tags += 'i'
                            arg_bytes += OSCEncoder.encode_int32(int(num))
                        else:
                            type_tags += 'f'
                            arg_bytes += OSCEncoder.encode_float32(num)
                    else:
                        # 默认作为字符串处理
                        type_tags += 's'
                        arg_bytes += OSCEncoder.encode_string(str(arg))
                except (ValueError, TypeError) as e:
                    logger.warning(f"无法编码参数: {arg}, 类型: {type(arg)}, 错误: {e}")
                    # 作为字符串处理
                    type_tags += 's'
                    arg_bytes += OSCEncoder.encode_string(str(arg))
        
        # 编码类型标签
        type_tags_bytes = OSCEncoder.pad_string(type_tags)
        
        return address_bytes + type_tags_bytes + arg_bytes
    
    @staticmethod
    def encode_bundle(time_tag: int, messages: List[Dict[str, Any]]) -> bytes:
        """编码 OSC Bundle"""
        # Bundle 标识符
        bundle_bytes = b'#bundle'
        bundle_bytes += b'\x00'  # 填充到 8 字节
        
        # 时间标签 (OSC 时间标签格式: NTP 时间戳)
        # 如果 time_tag 是毫秒时间戳，转换为 NTP 格式
        # NTP 时间戳 = (秒数 << 32) | 小数部分
        # 对于立即执行，使用 0x0000000000000001
        if time_tag <= 0:
            # 立即执行
            bundle_bytes += struct.pack('>II', 0, 1)
        else:
            # 转换为 NTP 时间戳
            # NTP 时间戳从 1900-01-01 开始，但 OSC 通常使用相对时间或立即执行
            # 这里简化处理：使用立即执行（0x0000000000000001）或当前时间
            # 对于 TUIO，通常使用立即执行
            bundle_bytes += struct.pack('>II', 0, 1)
        
        # 编码每个消息
        for msg in messages:
            msg_bytes = OSCEncoder.encode_message(msg['address'], msg['args'])
            # 添加消息长度（4 字节大端）
            bundle_bytes += struct.pack('>I', len(msg_bytes))
            bundle_bytes += msg_bytes
        
        return bundle_bytes


class WebTUIOBridge:
    """WebTUIO 桥接服务器"""
    
    def __init__(self, ws_host: str = DEFAULT_WS_HOST, ws_port: int = DEFAULT_WS_PORT,
                 udp_host: str = DEFAULT_UDP_HOST, udp_port: int = DEFAULT_UDP_PORT):
        self.ws_host = ws_host
        self.ws_port = ws_port
        self.udp_host = udp_host
        self.udp_port = udp_port
        self.udp_socket = None
        self.connected_clients = set()
        
    def setup_udp(self):
        """设置 UDP 套接字"""
        try:
            self.udp_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            logger.info(f"UDP 套接字已创建，目标: {self.udp_host}:{self.udp_port}")
        except Exception as e:
            logger.error(f"创建 UDP 套接字失败: {e}")
            raise
    
    def send_udp(self, data: bytes):
        """通过 UDP 发送数据"""
        if self.udp_socket:
            try:
                self.udp_socket.sendto(data, (self.udp_host, self.udp_port))
            except Exception as e:
                logger.error(f"UDP 发送失败: {e}")
        else:
            logger.error("UDP 套接字未初始化")
    
    def parse_json_message(self, json_str: str) -> Optional[List[Dict[str, Any]]]:
        """解析 JSON 格式的 OSC 消息"""
        try:
            data = json.loads(json_str)
            
            # 处理单个消息
            if isinstance(data, dict) and 'address' in data:
                return [data]
            
            # 处理 Bundle
            if isinstance(data, dict):
                if 'bundle' in data and data.get('bundle') is True:
                    # 格式: { bundle: true, packets: [...] }
                    packets = data.get('packets', [])
                    return packets if isinstance(packets, list) else [packets]
                elif 'timeTag' in data and 'packets' in data:
                    # 格式: { timeTag: number, packets: [...] }
                    return data.get('packets', [])
                elif 'packets' in data:
                    return data.get('packets', [])
            
            # 处理消息数组
            if isinstance(data, list):
                return data
            
            logger.warning(f"无法识别的消息格式: {data}")
            return None
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON 解析失败: {e}, 数据: {json_str[:100]}")
            return None
        except Exception as e:
            logger.error(f"解析消息时出错: {e}")
            return None
    
    def process_messages(self, messages: List[Dict[str, Any]]) -> bytes:
        """处理消息列表，编码为 OSC 格式"""
        if not messages:
            return b''
        
        # 如果只有一条消息，直接编码
        if len(messages) == 1:
            msg = messages[0]
            return OSCEncoder.encode_message(msg.get('address', ''), msg.get('args', []))
        
        # 多条消息，编码为 Bundle
        # 使用当前时间作为时间标签
        time_tag = int(datetime.now().timestamp() * 1000)
        return OSCEncoder.encode_bundle(time_tag, messages)
    
    async def handle_client(self, websocket):
        """处理 WebSocket 客户端连接"""
        try:
            client_addr = f"{websocket.remote_address[0]}:{websocket.remote_address[1]}"
        except:
            client_addr = "unknown"
        logger.info(f"客户端连接: {client_addr}")
        self.connected_clients.add(websocket)
        
        try:
            async for message in websocket:
                if isinstance(message, str):
                    # 解析 JSON 消息
                    messages = self.parse_json_message(message)
                    
                    if messages:
                        # 调试：记录坐标信息和消息结构
                        for msg in messages:
                            if msg.get('address') == '/tuio/2Dcur' and len(msg.get('args', [])) >= 3:
                                args = msg.get('args', [])
                                if args[0] == 'set' and len(args) >= 7:
                                    session_id = args[1]
                                    x = args[2]
                                    y = args[3]
                                    vx = args[4]
                                    vy = args[5]
                                    accel = args[6]
                                    logger.debug(f"TUIO set: session={session_id} (type={type(session_id).__name__}), "
                                               f"x={x:.3f} (type={type(x).__name__}), y={y:.3f} (type={type(y).__name__}), "
                                               f"vx={vx:.3f}, vy={vy:.3f}, accel={accel:.3f}")
                                elif args[0] == 'alive':
                                    logger.debug(f"TUIO alive: {args[1:]}")
                                elif args[0] == 'fseq':
                                    logger.debug(f"TUIO fseq: {args[1]}")
                                elif args[0] == 'source':
                                    logger.debug(f"TUIO source: {args[1]}")
                        
                        # 编码为 OSC 格式
                        osc_data = self.process_messages(messages)
                        
                        if osc_data:
                            # 通过 UDP 发送
                            self.send_udp(osc_data)
                            logger.debug(f"已转发消息到 UDP {self.udp_host}:{self.udp_port}, "
                                       f"大小: {len(osc_data)} 字节")
                        else:
                            logger.warning("编码后的 OSC 数据为空")
                    else:
                        logger.warning(f"无法解析消息: {message[:100]}")
                else:
                    logger.warning(f"收到非文本消息，类型: {type(message)}")
                    
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"客户端断开连接: {client_addr}")
        except Exception as e:
            logger.error(f"处理客户端消息时出错: {e}")
        finally:
            self.connected_clients.discard(websocket)
    
    async def start(self):
        """启动服务器"""
        self.setup_udp()
        
        logger.info(f"启动 WebSocket 服务器: {self.ws_host}:{self.ws_port}")
        logger.info(f"UDP 目标地址: {self.udp_host}:{self.udp_port}")
        logger.info("等待客户端连接...")
        
        async with websockets.serve(self.handle_client, self.ws_host, self.ws_port):
            await asyncio.Future()  # 永久运行
    
    def cleanup(self):
        """清理资源"""
        if self.udp_socket:
            self.udp_socket.close()
            logger.info("UDP 套接字已关闭")


async def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='WebTUIO Bridge Server')
    parser.add_argument('--ws-host', type=str, default=DEFAULT_WS_HOST,
                       help=f'WebSocket 监听地址 (默认: {DEFAULT_WS_HOST})')
    parser.add_argument('--ws-port', type=int, default=DEFAULT_WS_PORT,
                       help=f'WebSocket 监听端口 (默认: {DEFAULT_WS_PORT})')
    parser.add_argument('--udp-host', type=str, default=DEFAULT_UDP_HOST,
                       help=f'UDP 目标地址 (默认: {DEFAULT_UDP_HOST})')
    parser.add_argument('--udp-port', type=int, default=DEFAULT_UDP_PORT,
                       help=f'UDP 目标端口 (默认: {DEFAULT_UDP_PORT})')
    parser.add_argument('--debug', action='store_true',
                       help='启用调试模式')
    
    args = parser.parse_args()
    
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
    
    bridge = WebTUIOBridge(
        ws_host=args.ws_host,
        ws_port=args.ws_port,
        udp_host=args.udp_host,
        udp_port=args.udp_port
    )
    
    try:
        await bridge.start()
    except KeyboardInterrupt:
        logger.info("收到中断信号，正在关闭服务器...")
    finally:
        bridge.cleanup()


if __name__ == '__main__':
    asyncio.run(main())

