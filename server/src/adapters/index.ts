import { ModelAdapter } from '../types/index.js';
import { ZhipuAdapter } from './zhipu.js';
import { KimiAdapter } from './kimi.js';
import { QwenAdapter } from './qwen.js';

// 所有可用的模型适配器（国产模型）
export const adapters: Record<string, ModelAdapter> = {
  glm: new ZhipuAdapter(),
  kimi: new KimiAdapter(),
  qwen: new QwenAdapter()
};

// 获取默认发言顺序
export function getModelOrder(): string[] {
  const order = process.env.DEFAULT_MODEL_ORDER || 'glm,kimi,qwen';
  return order.split(',').map(s => s.trim());
}

// 获取记录员模型
export function getRecorderModel(): ModelAdapter {
  const recorderId = process.env.RECORDER_MODEL || 'glm';
  return adapters[recorderId] || adapters.glm;
}
