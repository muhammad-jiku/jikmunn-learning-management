import {
  chapterSchema,
  courseSchema,
  guestSchema,
  notificationSettingsSchema,
  sectionSchema,
} from '@/lib/schemas';

describe('Form Schemas', () => {
  describe('courseSchema', () => {
    it('should validate a valid course', () => {
      const result = courseSchema.safeParse({
        courseTitle: 'Test Course',
        courseDescription: 'A description',
        courseCategory: 'web-development',
        coursePrice: '49.99',
        courseStatus: true,
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty title', () => {
      const result = courseSchema.safeParse({
        courseTitle: '',
        courseDescription: 'A description',
        courseCategory: 'web-development',
        coursePrice: '49.99',
        courseStatus: true,
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty description', () => {
      const result = courseSchema.safeParse({
        courseTitle: 'Test',
        courseDescription: '',
        courseCategory: 'web-development',
        coursePrice: '0',
        courseStatus: false,
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty category', () => {
      const result = courseSchema.safeParse({
        courseTitle: 'Test',
        courseDescription: 'desc',
        courseCategory: '',
        coursePrice: '0',
        courseStatus: false,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('chapterSchema', () => {
    it('should validate a valid chapter', () => {
      const result = chapterSchema.safeParse({
        title: 'Chapter 1',
        content: 'This is the chapter content with enough text',
        freePreview: false,
      });
      expect(result.success).toBe(true);
    });

    it('should reject short title', () => {
      const result = chapterSchema.safeParse({
        title: 'A',
        content: 'This is content with enough text',
        freePreview: false,
      });
      expect(result.success).toBe(false);
    });

    it('should reject short content', () => {
      const result = chapterSchema.safeParse({
        title: 'Chapter 1',
        content: 'Short',
        freePreview: false,
      });
      expect(result.success).toBe(false);
    });

    it('should allow optional video field', () => {
      const result = chapterSchema.safeParse({
        title: 'Chapter 1',
        content: 'This is the chapter content with enough text',
        video: 'https://example.com/video.mp4',
        freePreview: true,
      });
      expect(result.success).toBe(true);
    });

    it('should allow optional youtubeVideoId', () => {
      const result = chapterSchema.safeParse({
        title: 'Chapter 1',
        content: 'This is the chapter content with enough text',
        youtubeVideoId: 'dQw4w9WgXcQ',
        freePreview: false,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('sectionSchema', () => {
    it('should validate a valid section', () => {
      const result = sectionSchema.safeParse({
        title: 'Section 1',
        description: 'This is a section description with enough characters',
      });
      expect(result.success).toBe(true);
    });

    it('should reject short title', () => {
      const result = sectionSchema.safeParse({
        title: 'A',
        description: 'This is a section description',
      });
      expect(result.success).toBe(false);
    });

    it('should reject short description', () => {
      const result = sectionSchema.safeParse({
        title: 'Section 1',
        description: 'Too short',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('guestSchema', () => {
    it('should validate a valid email', () => {
      const result = guestSchema.safeParse({ email: 'test@example.com' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = guestSchema.safeParse({ email: 'not-an-email' });
      expect(result.success).toBe(false);
    });

    it('should reject empty email', () => {
      const result = guestSchema.safeParse({ email: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('notificationSettingsSchema', () => {
    it('should validate valid settings', () => {
      const result = notificationSettingsSchema.safeParse({
        courseNotifications: true,
        emailAlerts: true,
        smsAlerts: false,
        notificationFrequency: 'daily',
      });
      expect(result.success).toBe(true);
    });

    it('should accept all frequency values', () => {
      for (const freq of ['immediate', 'daily', 'weekly']) {
        const result = notificationSettingsSchema.safeParse({
          courseNotifications: true,
          emailAlerts: true,
          smsAlerts: false,
          notificationFrequency: freq,
        });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid frequency', () => {
      const result = notificationSettingsSchema.safeParse({
        courseNotifications: true,
        emailAlerts: true,
        smsAlerts: false,
        notificationFrequency: 'monthly',
      });
      expect(result.success).toBe(false);
    });
  });
});
