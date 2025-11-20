#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简单的测试客户端，用于测试 WebTUIO Bridge Server
"""

import asyncio
import json
import websockets


async def test_server():
    """测试服务器连接和消息发送"""
    uri = "ws://localhost:8080"
    
    print(f"连接到 {uri}...")
    
    try:
        async with websockets.connect(uri) as websocket:
            print("连接成功！")
            
            # 测试 1: 发送单个消息
            print("\n测试 1: 发送单个消息...")
            message1 = {
                "address": "/tuio/2Dcur",
                "args": ["source", "WebTUIO@test"]
            }
            await websocket.send(json.dumps(message1))
            print(f"已发送: {message1}")
            
            await asyncio.sleep(0.5)
            
            # 测试 2: 发送 Bundle
            print("\n测试 2: 发送 Bundle...")
            message2 = {
                "bundle": True,
                "packets": [
                    {
                        "address": "/tuio/2Dcur",
                        "args": ["source", "WebTUIO@test"]
                    },
                    {
                        "address": "/tuio/2Dcur",
                        "args": ["set", 1, 0.5, 0.5, 0.0, 0.0, 0.0]
                    },
                    {
                        "address": "/tuio/2Dcur",
                        "args": ["alive", 1]
                    },
                    {
                        "address": "/tuio/2Dcur",
                        "args": ["fseq", 1]
                    }
                ]
            }
            await websocket.send(json.dumps(message2))
            print(f"已发送 Bundle，包含 {len(message2['packets'])} 条消息")
            
            await asyncio.sleep(0.5)
            
            # 测试 3: 发送带时间标签的 Bundle
            print("\n测试 3: 发送带时间标签的 Bundle...")
            import time
            message3 = {
                "timeTag": int(time.time() * 1000),
                "packets": [
                    {
                        "address": "/tuio/2Dcur",
                        "args": ["set", 2, 0.3, 0.7, 0.1, -0.1, 0.0]
                    }
                ]
            }
            await websocket.send(json.dumps(message3))
            print(f"已发送带时间标签的 Bundle")
            
            await asyncio.sleep(0.5)
            
            print("\n所有测试完成！")
            print("请检查服务器日志和 UDP 目标是否收到数据。")
            
    except websockets.exceptions.InvalidURI:
        print(f"错误: 无效的 URI: {uri}")
    except websockets.exceptions.InvalidHandshake:
        print("错误: WebSocket 握手失败")
    except ConnectionRefusedError:
        print(f"错误: 无法连接到 {uri}")
        print("请确保服务器正在运行: python server.py")
    except Exception as e:
        print(f"错误: {e}")


if __name__ == '__main__':
    print("WebTUIO Bridge Server 测试客户端")
    print("=" * 50)
    asyncio.run(test_server())

