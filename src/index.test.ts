import { keccak256AxiosInterceptor } from './axios-interceptor';

describe('unit | keccak256AxiosInterceptor', () => {
  it('sets Authorization header', () => {
    const interceptor = keccak256AxiosInterceptor({
      privateKey: Buffer.from('a'.repeat(32), 'utf-8').toString('hex'),
    });

    const newConfigs = interceptor({
      method: 'GET',
      baseURL: 'https://example.com',
      url: '/url',
    });

    expect(newConfigs.headers?.['authorization']).toBeDefined();
    expect(newConfigs.headers?.['authorization']).toMatch(/^Keccak-256 .+/);
  });
});
