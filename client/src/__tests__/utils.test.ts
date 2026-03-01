import {
  centsToDollars,
  cn,
  convertToSubCurrency,
  dollarsToCents,
  extractYouTubeId,
  formatPrice,
  getYouTubeEmbedUrl,
  getYouTubeThumbnail,
  isValidYouTubeInput,
} from '@/lib/utils';

describe('Utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      const condition = false;
      expect(cn('foo', condition && 'bar', 'baz')).toBe('foo baz');
    });
  });

  describe('formatPrice', () => {
    it('should format cents to currency string', () => {
      expect(formatPrice(4999)).toBe('$49.99');
    });

    it('should handle undefined', () => {
      expect(formatPrice(undefined)).toBe('$0.00');
    });

    it('should handle zero', () => {
      expect(formatPrice(0)).toBe('$0.00');
    });
  });

  describe('dollarsToCents', () => {
    it('should convert string dollars to cents', () => {
      expect(dollarsToCents('49.99')).toBe(4999);
    });

    it('should convert number dollars to cents', () => {
      expect(dollarsToCents(10)).toBe(1000);
    });
  });

  describe('centsToDollars', () => {
    it('should convert cents to dollar string', () => {
      expect(centsToDollars(4999)).toBe('49.99');
    });

    it('should handle undefined', () => {
      expect(centsToDollars(undefined)).toBe('0');
    });
  });

  describe('convertToSubCurrency', () => {
    it('should convert to sub currency', () => {
      expect(convertToSubCurrency(49.99)).toBe(4999);
    });
  });
});

describe('YouTube Utilities', () => {
  describe('extractYouTubeId', () => {
    it('should extract ID from standard URL', () => {
      expect(
        extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
      ).toBe('dQw4w9WgXcQ');
    });

    it('should extract ID from short URL', () => {
      expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe(
        'dQw4w9WgXcQ'
      );
    });

    it('should extract ID from embed URL', () => {
      expect(
        extractYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')
      ).toBe('dQw4w9WgXcQ');
    });

    it('should return raw ID if already valid', () => {
      expect(extractYouTubeId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should return null for invalid input', () => {
      expect(extractYouTubeId('not-a-valid-video-url')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(extractYouTubeId('')).toBeNull();
    });
  });

  describe('isValidYouTubeInput', () => {
    it('should return true for valid YouTube URL', () => {
      expect(
        isValidYouTubeInput('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
      ).toBe(true);
    });

    it('should return false for invalid input', () => {
      expect(isValidYouTubeInput('random-string')).toBe(false);
    });
  });

  describe('getYouTubeEmbedUrl', () => {
    it('should return embed URL', () => {
      expect(getYouTubeEmbedUrl('dQw4w9WgXcQ')).toBe(
        'https://www.youtube.com/embed/dQw4w9WgXcQ'
      );
    });
  });

  describe('getYouTubeThumbnail', () => {
    it('should return high quality thumbnail by default', () => {
      expect(getYouTubeThumbnail('dQw4w9WgXcQ')).toBe(
        'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
      );
    });

    it('should return maxres thumbnail when specified', () => {
      expect(getYouTubeThumbnail('dQw4w9WgXcQ', 'maxres')).toBe(
        'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
      );
    });
  });
});
