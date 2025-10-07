/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { clsx, type ClassValue } from 'clsx';
import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';
import * as z from 'zod';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert cents to formatted currency string (e.g., 4999 -> "$49.99")
export function formatPrice(cents: number | undefined): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format((cents || 0) / 100);
}

// Convert dollars to cents (e.g., "49.99" -> 4999)
export function dollarsToCents(dollars: string | number): number {
  const amount = typeof dollars === 'string' ? parseFloat(dollars) : dollars;
  return Math.round(amount * 100);
}

// Convert cents to dollars (e.g., 4999 -> "49.99")
export function centsToDollars(cents: number | undefined): string {
  return ((cents || 0) / 100).toString();
}

// Zod schema for price input (converts dollar input to cents)
export const priceSchema = z.string().transform((val) => {
  const dollars = parseFloat(val);
  if (isNaN(dollars)) return '0';
  return dollarsToCents(dollars).toString();
});

export const countries = [
  'Afghanistan',
  'Albania',
  'Algeria',
  'Andorra',
  'Angola',
  'Antigua and Barbuda',
  'Argentina',
  'Armenia',
  'Australia',
  'Austria',
  'Azerbaijan',
  'Bahamas',
  'Bahrain',
  'Bangladesh',
  'Barbados',
  'Belarus',
  'Belgium',
  'Belize',
  'Benin',
  'Bhutan',
  'Bolivia',
  'Bosnia and Herzegovina',
  'Botswana',
  'Brazil',
  'Brunei',
  'Bulgaria',
  'Burkina Faso',
  'Burundi',
  'Cabo Verde',
  'Cambodia',
  'Cameroon',
  'Canada',
  'Central African Republic',
  'Chad',
  'Chile',
  'China',
  'Colombia',
  'Comoros',
  'Congo (Congo-Brazzaville)',
  'Costa Rica',
  'Croatia',
  'Cuba',
  'Cyprus',
  'Czech Republic',
  'Democratic Republic of the Congo',
  'Denmark',
  'Djibouti',
  'Dominica',
  'Dominican Republic',
  'East Timor (Timor-Leste)',
  'Ecuador',
  'Egypt',
  'El Salvador',
  'Equatorial Guinea',
  'Eritrea',
  'Estonia',
  'Eswatini',
  'Ethiopia',
  'Fiji',
  'Finland',
  'France',
  'Gabon',
  'Gambia',
  'Georgia',
  'Germany',
  'Ghana',
  'Greece',
  'Grenada',
  'Guatemala',
  'Guinea',
  'Guinea-Bissau',
  'Guyana',
  'Haiti',
  'Honduras',
  'Hungary',
  'Iceland',
  'India',
  'Indonesia',
  'Iran',
  'Iraq',
  'Ireland',
  'Italy',
  'Jamaica',
  'Japan',
  'Jordan',
  'Kazakhstan',
  'Kenya',
  'Kiribati',
  'Kuwait',
  'Kyrgyzstan',
  'Laos',
  'Latvia',
  'Lebanon',
  'Lesotho',
  'Liberia',
  'Libya',
  'Liechtenstein',
  'Lithuania',
  'Luxembourg',
  'Madagascar',
  'Malawi',
  'Malaysia',
  'Maldives',
  'Mali',
  'Malta',
  'Marshall Islands',
  'Mauritania',
  'Mauritius',
  'Mexico',
  'Micronesia',
  'Moldova',
  'Monaco',
  'Mongolia',
  'Montenegro',
  'Morocco',
  'Mozambique',
  'Myanmar (formerly Burma)',
  'Namibia',
  'Nauru',
  'Nepal',
  'Netherlands',
  'New Zealand',
  'Nicaragua',
  'Niger',
  'Nigeria',
  'North Korea',
  'North Macedonia',
  'Norway',
  'Oman',
  'Pakistan',
  'Palau',
  'Panama',
  'Papua New Guinea',
  'Paraguay',
  'Peru',
  'Philippines',
  'Poland',
  'Portugal',
  'Qatar',
  'Romania',
  'Russia',
  'Rwanda',
  'Saint Kitts and Nevis',
  'Saint Lucia',
  'Saint Vincent and the Grenadines',
  'Samoa',
  'San Marino',
  'Sao Tome and Principe',
  'Saudi Arabia',
  'Senegal',
  'Serbia',
  'Seychelles',
  'Sierra Leone',
  'Singapore',
  'Slovakia',
  'Slovenia',
  'Solomon Islands',
  'Somalia',
  'South Africa',
  'South Korea',
  'South Sudan',
  'Spain',
  'Sri Lanka',
  'Sudan',
  'Suriname',
  'Sweden',
  'Switzerland',
  'Syria',
  'Taiwan',
  'Tajikistan',
  'Tanzania',
  'Thailand',
  'Togo',
  'Tonga',
  'Trinidad and Tobago',
  'Tunisia',
  'Turkey',
  'Turkmenistan',
  'Tuvalu',
  'Uganda',
  'Ukraine',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'Uruguay',
  'Uzbekistan',
  'Vanuatu',
  'Vatican City',
  'Venezuela',
  'Vietnam',
  'Yemen',
  'Zambia',
  'Zimbabwe',
];

export const customStyles = 'text-gray-300 placeholder:text-gray-500';

export function convertToSubCurrency(amount: number, factor = 100) {
  return Math.round(amount * factor);
}

export const NAVBAR_HEIGHT = 48;

export const courseCategories = [
  { value: 'technology', label: 'Technology' },
  { value: 'science', label: 'Science' },
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'artificial-intelligence', label: 'Artificial Intelligence' },
] as const;

export const customDataGridStyles = {
  border: 'none',
  backgroundColor: '#17181D',
  '& .MuiDataGrid-columnHeaders': {
    backgroundColor: '#1B1C22',
    color: '#6e6e6e',
    "& [role='row'] > *": {
      backgroundColor: '#1B1C22 !important',
      border: 'none !important',
    },
  },
  '& .MuiDataGrid-cell': {
    color: '#6e6e6e',
    border: 'none !important',
  },
  '& .MuiDataGrid-row': {
    backgroundColor: '#17181D',
    '&:hover': {
      backgroundColor: '#25262F',
    },
  },
  '& .MuiDataGrid-footerContainer': {
    backgroundColor: '#17181D',
    color: '#6e6e6e',
    border: 'none !important',
  },
  '& .MuiDataGrid-filler': {
    border: 'none !important',
    backgroundColor: '#17181D !important',
    borderTop: 'none !important',
    '& div': {
      borderTop: 'none !important',
    },
  },
  '& .MuiTablePagination-root': {
    color: '#6e6e6e',
  },
  '& .MuiTablePagination-actions .MuiIconButton-root': {
    color: '#6e6e6e',
  },
};

export const createCourseFormData = (
  data: CourseFormData,
  sections: Section[]
): FormData => {
  const formData = new FormData();
  formData.append('title', data.courseTitle);
  formData.append('description', data.courseDescription);
  formData.append('category', data.courseCategory);
  formData.append('price', data.coursePrice.toString());
  formData.append('status', data.courseStatus ? 'Published' : 'Draft');

  const sectionsWithVideos = sections.map((section) => ({
    ...section,
    chapters: section.chapters.map((chapter) => ({
      ...chapter,
      video: chapter.video,
    })),
  }));

  formData.append('sections', JSON.stringify(sectionsWithVideos));

  return formData;
};

const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.\-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
};

export const uploadAllVideos = async (
  localSections: Section[],
  courseId: string,
  getUploadVideoUrl: any
) => {
  // console.log('🚀 STARTING uploadAllVideos - Course ID:', courseId);

  // Create a deep copy to avoid mutating Redux state
  const updatedSections = localSections.map((section) => ({
    ...section,
    chapters: [...section.chapters], // Create new chapters array
  }));

  let hasVideoFiles = false;

  for (let i = 0; i < updatedSections.length; i++) {
    const section = updatedSections[i];

    for (let j = 0; j < section.chapters.length; j++) {
      const chapter = section.chapters[j];

      // console.log(`🔍 Checking chapter: ${chapter.title}`, {
      //   videoType: typeof chapter.video,
      //   videoValue: chapter.video,
      //   currentType: chapter.type,
      // });

      // Only process if video is a File and type should be Video
      if (chapter.video instanceof File) {
        hasVideoFiles = true;
        // console.log('🎬 Found video file to upload:', chapter.video.name);

        try {
          const updatedChapter = await uploadVideo(
            chapter,
            courseId,
            section.sectionId,
            getUploadVideoUrl
          );

          // console.log('✅ Video uploaded, updating chapter:', {
          //   oldVideo: chapter.video,
          //   newVideo: updatedChapter.video,
          //   oldType: chapter.type,
          //   newType: updatedChapter.type,
          // });

          // Create a new chapters array with the updated chapter
          updatedSections[i] = {
            ...updatedSections[i],
            chapters: updatedSections[i].chapters.map((chap, index) =>
              index === j ? updatedChapter : chap
            ),
          };
        } catch (error) {
          // console.log(
          //   '❌ Video upload failed, keeping chapter as Text:',
          //   error
          // );
          // Create a new chapters array with the failed chapter
          updatedSections[i] = {
            ...updatedSections[i],
            chapters: updatedSections[i].chapters.map((chap, index) =>
              index === j
                ? {
                    ...chap,
                    video: '',
                    type: 'Text' as const,
                  }
                : chap
            ),
          };
        }
      } else if (chapter.type === 'Video' && !chapter.video) {
        //  // If chapter is marked as Video but has no video URL, revert to Text
        // console.log(
        //   '⚠️ Chapter marked as Video but has no video, reverting to Text'
        // );
        updatedSections[i] = {
          ...updatedSections[i],
          chapters: updatedSections[i].chapters.map((chap, index) =>
            index === j
              ? {
                  ...chap,
                  type: 'Text' as const,
                  video: '',
                }
              : chap
          ),
        };
      }
    }
  }

  if (!hasVideoFiles) {
    // console.log('ℹ️ No video files found to upload');
  }

  // console.log('🏁 FINAL sections:', JSON.stringify(updatedSections, null, 2));
  return updatedSections;
};

const uploadVideo = async (
  chapter: Chapter,
  courseId: string,
  sectionId: string,
  getUploadVideoUrl: any
) => {
  const file = chapter.video as File;

  // console.log('🎬 STARTING uploadVideo:', {
  //   chapterId: chapter.chapterId,
  //   courseId,
  //   sectionId,
  //   fileName: file.name,
  //   fileSize: file.size,
  //   fileType: file.type,
  // });

  try {
    const sanitizedFileName = sanitizeFilename(file.name);

    // ✅ Enhanced validation
    if (!file.name || !file.type || !file.size) {
      throw new Error('File metadata is incomplete');
    }

    if (file.size === 0) {
      throw new Error('File is empty');
    }

    // Get upload URL with all required parameters
    // console.log('🔄 Getting upload URL...');
    const { uploadUrl, videoUrl } = await getUploadVideoUrl({
      courseId: courseId,
      sectionId: sectionId,
      chapterId: chapter.chapterId,
      fileName: sanitizedFileName,
      fileType: file.type,
      fileSize: file.size, // Add file size
    }).unwrap();

    // console.log('📤 Upload URL received:', uploadUrl.substring(0, 100) + '...');
    // console.log('📺 Video URL that will be saved:', videoUrl);

    // Upload the file
    // console.log('⬆️  Starting file upload...');
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    // console.log('📨 Upload response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      // console.log('❌ Upload failed with response:', errorText);
      throw new Error(
        `Upload failed with status ${response.status}: ${errorText}`
      );
    }

    // console.log('✅ Upload successful!');
    // console.log('💾 Returning chapter with video URL:', videoUrl);

    toast.success(`Video uploaded successfully for chapter ${chapter.title}`);

    return {
      ...chapter,
      video: videoUrl,
      type: 'Video' as const,
    };
  } catch (error) {
    // console.log('💥 Upload video error:', error);
    toast.error(
      `Failed to upload video: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
    throw error;
  }
};
