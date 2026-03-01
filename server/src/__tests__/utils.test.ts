/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  calculateOverallProgress,
  mergeChapters,
  mergeSections,
} from '../utils';

describe('Utils', () => {
  describe('mergeSections', () => {
    it('should add new sections to empty array', () => {
      const existing: any[] = [];
      const newSections = [
        {
          sectionId: 's1',
          sectionTitle: 'Section 1',
          chapters: [],
        },
      ];

      const result = mergeSections(existing, newSections);
      expect(result).toHaveLength(1);
      expect(result[0].sectionId).toBe('s1');
    });

    it('should merge chapters in existing sections', () => {
      const existing = [
        {
          sectionId: 's1',
          sectionTitle: 'Section 1',
          chapters: [{ chapterId: 'c1', title: 'Chapter 1' }],
        },
      ];
      const newSections = [
        {
          sectionId: 's1',
          sectionTitle: 'Section 1',
          chapters: [{ chapterId: 'c2', title: 'Chapter 2' }],
        },
      ];

      const result = mergeSections(existing, newSections);
      expect(result).toHaveLength(1);
      expect(result[0].chapters).toHaveLength(2);
    });

    it('should add entirely new sections alongside existing ones', () => {
      const existing = [
        { sectionId: 's1', sectionTitle: 'Section 1', chapters: [] },
      ];
      const newSections = [
        { sectionId: 's2', sectionTitle: 'Section 2', chapters: [] },
      ];

      const result = mergeSections(existing, newSections);
      expect(result).toHaveLength(2);
    });
  });

  describe('mergeChapters', () => {
    it('should add new chapters', () => {
      const existing = [{ chapterId: 'c1', title: 'Ch 1' }];
      const newChapters = [{ chapterId: 'c2', title: 'Ch 2' }];

      const result = mergeChapters(existing, newChapters);
      expect(result).toHaveLength(2);
    });

    it('should overwrite existing chapters by chapterId', () => {
      const existing = [{ chapterId: 'c1', title: 'Old Title' }];
      const newChapters = [{ chapterId: 'c1', title: 'New Title' }];

      const result = mergeChapters(existing, newChapters);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('New Title');
    });
  });

  describe('calculateOverallProgress', () => {
    it('should return 0 for empty sections', () => {
      expect(calculateOverallProgress([])).toBe(0);
    });

    it('should return 0 when no chapters are completed', () => {
      const sections = [
        {
          sectionId: 's1',
          chapters: [
            { chapterId: 'c1', completed: false },
            { chapterId: 'c2', completed: false },
          ],
        },
      ];
      expect(calculateOverallProgress(sections)).toBe(0);
    });

    it('should return 100 when all chapters are completed', () => {
      const sections = [
        {
          sectionId: 's1',
          chapters: [
            { chapterId: 'c1', completed: true },
            { chapterId: 'c2', completed: true },
          ],
        },
      ];
      expect(calculateOverallProgress(sections)).toBe(100);
    });

    it('should return correct percentage for partial completion', () => {
      const sections = [
        {
          sectionId: 's1',
          chapters: [
            { chapterId: 'c1', completed: true },
            { chapterId: 'c2', completed: false },
            { chapterId: 'c3', completed: false },
            { chapterId: 'c4', completed: true },
          ],
        },
      ];
      expect(calculateOverallProgress(sections)).toBe(50);
    });
  });
});
