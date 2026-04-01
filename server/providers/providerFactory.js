import { MockProvider } from './mockProvider.js';
import { RealProvider } from './realProvider.js';

export const createMarketProvider = () => {
  const target = String(process.env.MARKET_PROVIDER ?? 'real').toLowerCase();

  if (target === 'mock') {
    return {
      name: 'mock',
      provider: new MockProvider(),
    };
  }

  return {
    name: 'real',
    provider: new RealProvider(),
  };
};

