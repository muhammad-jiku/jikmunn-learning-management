import { ALLOWED_FILE_TYPES, MAX_FILE_SIZES } from '../config/cloudinary';

describe('Cloudinary Config', () => {
  describe('ALLOWED_FILE_TYPES', () => {
    it('should define allowed image types', () => {
      expect(ALLOWED_FILE_TYPES.image).toContain('jpg');
      expect(ALLOWED_FILE_TYPES.image).toContain('jpeg');
      expect(ALLOWED_FILE_TYPES.image).toContain('png');
      expect(ALLOWED_FILE_TYPES.image).toContain('webp');
      expect(ALLOWED_FILE_TYPES.image).not.toContain('exe');
    });

    it('should define allowed video types', () => {
      expect(ALLOWED_FILE_TYPES.video).toContain('mp4');
      expect(ALLOWED_FILE_TYPES.video).toContain('webm');
    });

    it('should define allowed raw file types', () => {
      expect(ALLOWED_FILE_TYPES.raw).toContain('pdf');
      expect(ALLOWED_FILE_TYPES.raw).toContain('doc');
      expect(ALLOWED_FILE_TYPES.raw).toContain('docx');
    });
  });

  describe('MAX_FILE_SIZES', () => {
    it('should set 10MB limit for images', () => {
      expect(MAX_FILE_SIZES.image).toBe(10 * 1024 * 1024);
    });

    it('should set 500MB limit for videos', () => {
      expect(MAX_FILE_SIZES.video).toBe(500 * 1024 * 1024);
    });

    it('should set 50MB limit for raw files', () => {
      expect(MAX_FILE_SIZES.raw).toBe(50 * 1024 * 1024);
    });

    it('should have image limit smaller than video limit', () => {
      expect(MAX_FILE_SIZES.image).toBeLessThan(MAX_FILE_SIZES.video);
    });
  });
});
