import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isStudentRoute = createRouteMatcher(['/student/(.*)']);
const isTeacherRoute = createRouteMatcher(['/teacher/(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { sessionClaims } = await auth();

  // const userRole =
  //   (
  //     sessionClaims?.metadata as {
  //       userType: 'student' | 'teacher';
  //     }
  //   )?.userType || 'student';

  // if (isStudentRoute(req)) {
  //   if (userRole !== 'student') {
  //     const url = new URL('/teacher/courses', req.url);
  //     return NextResponse.redirect(url);
  //   }
  // }

  // if (isTeacherRoute(req)) {
  //   if (userRole !== 'teacher') {
  //     const url = new URL('/student/courses', req.url);
  //     return NextResponse.redirect(url);
  //   }
  // }

  // NOTE: don't default to 'student' here — allow `undefined` when metadata isn't present yet
  const metadata = sessionClaims?.metadata as
    | { userType?: 'student' | 'teacher' }
    | undefined;
  const userRole = metadata?.userType; // could be undefined

  // If the session token doesn't contain a role, do not assume student.
  // This avoids accidentally redirecting users during token propagation.
  if (!userRole) {
    return NextResponse.next();
  }

  // Only redirect when we have a concrete role and a mismatched route
  if (isStudentRoute(req) && userRole !== 'student') {
    const url = new URL('/teacher/courses', req.url);
    return NextResponse.redirect(url);
  }

  if (isTeacherRoute(req) && userRole !== 'teacher') {
    const url = new URL('/student/courses', req.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
