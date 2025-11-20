import { AppSettings, Protocol } from './types';

export const DEFAULT_SETTINGS: AppSettings = {
  host: '127.0.0.1', // Localhost default for bridge
  port: 8080, // Default WebSocket Port (Standard TUIO bridges like osc-web-bridge use 8080)
  protocol: Protocol.UDP_BRIDGE,
  periodicUpdates: true,
  fullBundle: true,
  blobMessages: false, // Not fully implemented in this demo, but toggle exists
  invertY: false, // 默认不反转Y轴
  coordinateScale: 1.0, // 默认使用归一化坐标（0-1），可以设置为更大的值如1920或1080来使用像素坐标
};

export const STORAGE_KEY = 'webtuio_settings_v1';

export const TUIO_PROFILE = '/tuio/2Dcur';
export const SOURCE_NAME = 'WebTUIO@webclient';