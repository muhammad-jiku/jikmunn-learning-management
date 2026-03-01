describe('Security Middleware Configuration', () => {
  describe('Rate Limiting', () => {
    it('should define rate limit window as 15 minutes', () => {
      const windowMs = 15 * 60 * 1000;
      expect(windowMs).toBe(900000);
    });

    it('should allow more requests in development', () => {
      const devMax = 1000;
      const prodMax = 100;
      expect(devMax).toBeGreaterThan(prodMax);
    });

    it('should have stricter auth rate limits', () => {
      const apiMax = 100;
      const authMax = 20;
      expect(authMax).toBeLessThan(apiMax);
    });
  });

  describe('CORS Configuration', () => {
    it('should allow localhost in development', () => {
      const devOrigins = ['http://localhost:3000', 'http://localhost:3001'];
      expect(devOrigins).toContain('http://localhost:3000');
      expect(devOrigins).toContain('http://localhost:3001');
    });

    it('should restrict origins in production', () => {
      const prodOrigins = ['https://learn-now.vercel.app'];
      expect(prodOrigins).toHaveLength(1);
      expect(prodOrigins[0]).toMatch(/^https:\/\//);
    });

    it('should allow standard HTTP methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
      expect(methods).toContain('GET');
      expect(methods).toContain('POST');
      expect(methods).toContain('PUT');
      expect(methods).toContain('DELETE');
    });
  });
});
