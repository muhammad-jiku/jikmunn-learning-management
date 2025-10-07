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
import { ChapterFormData, chapterSchema } from '@/lib/schemas';
import { addChapter, closeChapterModal, editChapter } from '@/state';
import { useAppDispatch, useAppSelector } from '@/state/redux';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
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
      video: '',
    },
  });

  useEffect(() => {
    if (chapter) {
      methods.reset({
        title: chapter.title,
        content: chapter.content,
        video: chapter.video || '',
      });
    } else {
      methods.reset({
        title: '',
        content: '',
        video: '',
      });
    }
  }, [chapter, methods]);

  const onClose = () => {
    dispatch(closeChapterModal());
  };

  const onSubmit = (data: ChapterFormData) => {
    if (selectedSectionIndex === null) return;

    // console.log('📝 Submitted data:', data);
    // console.log('📁 File details:', {
    //   hasVideo: !!data.video,
    //   videoType: typeof data.video,
    //   videoIsFile: data.video instanceof File,
    //   videoName: data.video instanceof File ? data.video.name : 'N/A',
    //   videoTypeProp: data.video instanceof File ? data.video.type : 'N/A',
    //   videoSize: data.video instanceof File ? data.video.size : 'N/A',
    // });

    // Determine the type based on whether video is provided
    const hasVideo =
      data.video &&
      (typeof data.video === 'string'
        ? data.video.trim() !== ''
        : data.video instanceof File);

    const newChapter: Chapter = {
      chapterId: chapter?.chapterId || uuidv4(),
      title: data.title,
      content: data.content,
      type: hasVideo ? 'Video' : 'Text',
      video: data.video || '',
    };

    // console.log('📝 Creating/Updating chapter:', {
    //   chapterId: newChapter.chapterId,
    //   title: newChapter.title,
    //   type: newChapter.type,
    //   video: newChapter.video,
    //   hasVideo: hasVideo,
    // });

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
              name='video'
              render={({ field: { onChange, value } }) => (
                <FormItem>
                  <FormLabel className='text-customgreys-dirty-grey text-sm'>
                    Chapter Video
                  </FormLabel>
                  <FormControl>
                    <div>
                      <Input
                        type='file'
                        accept='video/mp4,video/webm,video/ogg'
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // Enhanced validation
                            if (file.size > 500 * 1024 * 1024) {
                              toast.error('Video file must be less than 500MB');
                              return;
                            }
                            if (!file.type.startsWith('video/')) {
                              toast.error('Please select a valid video file');
                              return;
                            }
                            if (file.size === 0) {
                              toast.error('File appears to be empty');
                              return;
                            }

                            // console.log('📁 File selected:', {
                            //   name: file.name,
                            //   type: file.type,
                            //   size: file.size,
                            // });

                            onChange(file);
                          }
                        }}
                        className='border-none bg-customgreys-dark-grey py-2 cursor-pointer'
                      />
                      {typeof value === 'string' && value && (
                        <div className='my-2 text-sm text-gray-600'>
                          Current video: {value.split('/').pop()}
                        </div>
                      )}
                      {value instanceof File && (
                        <div className='my-2 text-sm text-white-100'>
                          Selected: {value.name} (
                          {(value.size / (1024 * 1024)).toFixed(2)} MB)
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage className='text-red-400' />
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
