import { CustomFormField } from '@/components/custom/CustomFormField';
import CustomModal from '@/components/custom/CustomModal';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ChapterFormData, chapterSchema } from '@/lib/schemas';
import { extractYouTubeId, isValidYouTubeInput } from '@/lib/utils';
import { addChapter, closeChapterModal, editChapter } from '@/state';
import { useAppDispatch, useAppSelector } from '@/state/redux';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, X, Youtube } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

const ChapterModal = () => {
  const dispatch = useAppDispatch();
  const {
    isChapterModalOpen,
    selectedSectionIndex,
    selectedChapterIndex,
    sections,
  } = useAppSelector((state) => state.global.courseEditor);

  const chapter: Chapter | undefined =
    selectedSectionIndex !== null && selectedChapterIndex !== null
      ? sections[selectedSectionIndex].chapters[selectedChapterIndex]
      : undefined;

  const methods = useForm<ChapterFormData>({
    resolver: zodResolver(chapterSchema),
    defaultValues: {
      title: '',
      content: '',
      video: '', // Legacy field
      youtubeVideoId: '',
      freePreview: false,
    },
  });

  useEffect(() => {
    if (chapter) {
      methods.reset({
        title: chapter.title,
        content: chapter.content,
        video: chapter.video || '',
        youtubeVideoId: chapter.youtubeVideoId || '',
        freePreview: chapter.freePreview || false,
      });
    } else {
      methods.reset({
        title: '',
        content: '',
        video: '',
        youtubeVideoId: '',
        freePreview: false,
      });
    }
  }, [chapter, methods]);

  const onClose = () => {
    dispatch(closeChapterModal());
  };

  const onSubmit = (data: ChapterFormData) => {
    if (selectedSectionIndex === null) return;

    // Extract YouTube video ID if provided
    let youtubeVideoId: string | undefined;
    if (data.youtubeVideoId) {
      const extractedId = extractYouTubeId(data.youtubeVideoId);
      if (data.youtubeVideoId && !extractedId) {
        toast.error('Invalid YouTube video ID or URL');
        return;
      }
      youtubeVideoId = extractedId || undefined;
    }

    // Determine the type based on whether YouTube video ID is provided
    const hasVideo = !!youtubeVideoId;

    const newChapter: Chapter = {
      chapterId: chapter?.chapterId || uuidv4(),
      title: data.title,
      content: data.content,
      type: hasVideo ? 'Video' : 'Text',
      video: data.video || '', // Legacy field
      youtubeVideoId: youtubeVideoId,
      freePreview: data.freePreview || false,
    };

    if (selectedChapterIndex === null) {
      dispatch(
        addChapter({
          sectionIndex: selectedSectionIndex,
          chapter: newChapter,
        })
      );
      toast.success('Chapter added successfully');
    } else {
      dispatch(
        editChapter({
          sectionIndex: selectedSectionIndex,
          chapterIndex: selectedChapterIndex,
          chapter: newChapter,
        })
      );
      toast.success('Chapter updated successfully');
    }

    onClose();
  };

  return (
    <CustomModal isOpen={isChapterModalOpen} onClose={onClose}>
      <div className='chapter-modal'>
        <div className='chapter-modal__header'>
          <h2 className='chapter-modal__title'>Add/Edit Chapter</h2>
          <button onClick={onClose} className='chapter-modal__close'>
            <X className='w-6 h-6' />
          </button>
        </div>

        <Form {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className='chapter-modal__form'
          >
            <CustomFormField
              name='title'
              label='Chapter Title'
              placeholder='Write chapter title here'
            />
            <CustomFormField
              name='content'
              label='Chapter Content'
              type='textarea'
              placeholder='Write chapter content here'
            />

            <FormField
              control={methods.control}
              name='youtubeVideoId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-customgreys-dirty-grey text-sm flex items-center gap-2'>
                    <Youtube className='w-4 h-4 text-red-500' />
                    YouTube Video (Optional)
                  </FormLabel>
                  <FormControl>
                    <div>
                      <Input
                        {...field}
                        type='text'
                        placeholder='Enter YouTube URL or Video ID (e.g., dQw4w9WgXcQ)'
                        className='border-none bg-customgreys-dark-grey py-2'
                        onChange={(e) => {
                          field.onChange(e.target.value);
                        }}
                      />
                      {field.value && isValidYouTubeInput(field.value) && (
                        <div className='mt-3'>
                          <p className='text-sm text-green-500 mb-2'>
                            ✓ Valid YouTube video detected
                          </p>
                          <div className='relative aspect-video w-full max-w-md rounded-lg overflow-hidden bg-black'>
                            <iframe
                              src={`https://www.youtube.com/embed/${extractYouTubeId(field.value)}`}
                              className='absolute inset-0 w-full h-full'
                              allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                              allowFullScreen
                            />
                          </div>
                        </div>
                      )}
                      {field.value && !isValidYouTubeInput(field.value) && (
                        <p className='mt-2 text-sm text-red-400'>
                          Invalid YouTube URL or Video ID
                        </p>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage className='text-red-400' />
                </FormItem>
              )}
            />
            <FormField
              control={methods.control}
              name='freePreview'
              render={({ field }) => (
                <FormItem className='flex items-center justify-between rounded-lg border border-customgreys-dark-grey p-4'>
                  <div className='flex items-center gap-2'>
                    <Eye className='w-4 h-4 text-primary-700' />
                    <div>
                      <FormLabel className='text-customgreys-dirty-grey text-sm'>
                        Free Preview
                      </FormLabel>
                      <p className='text-xs text-customgreys-dirty-grey'>
                        Allow non-enrolled students to preview this chapter
                      </p>
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className='chapter-modal__actions'>
              <Button type='button' variant='outline' onClick={onClose}>
                Cancel
              </Button>
              <Button type='submit' className='bg-primary-700'>
                Save
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </CustomModal>
  );
};

export default ChapterModal;
