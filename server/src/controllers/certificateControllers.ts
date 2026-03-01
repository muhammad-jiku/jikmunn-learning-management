import { getAuth } from '@clerk/express';
import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import logger from '../config/logger';
import { clerkClient } from '../index';
import Certificate from '../models/certificateModel';
import Course from '../models/courseModel';
import UserCourseProgress from '../models/userCourseProgressModel';

// ─── Generate Certificate ──────────────────────────────────────────────────────

export const generateCertificate = async (
  req: Request,
  res: Response
): Promise<void> => {
  const auth = getAuth(req);
  const { courseId } = req.body;
  const userId = auth?.userId;

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    // Check if certificate already exists
    const existingCert = await Certificate.findOne({ userId, courseId });
    if (existingCert) {
      res.status(200).json({
        message: 'Certificate already exists',
        data: existingCert,
      });
      return;
    }

    // Verify course completion
    const progress = await UserCourseProgress.findOne({ userId, courseId });
    if (!progress || progress.overallProgress < 100) {
      res.status(400).json({
        message: 'Course not completed yet',
        data: { overallProgress: progress?.overallProgress ?? 0 },
      });
      return;
    }

    // Get course and user details
    const course = await Course.findOne({ courseId });
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    let userName = 'Student';
    try {
      const user = await clerkClient.users.getUser(userId);
      userName =
        `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
        user.username ||
        'Student';
    } catch {
      logger.warn('Could not fetch user name for certificate', { userId });
    }

    const certificateId = uuidv4();
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const verificationUrl = `${clientUrl}/certificates/verify/${certificateId}`;

    const certificate = new Certificate({
      certificateId,
      userId,
      courseId,
      courseName: course.title,
      userName,
      issuedAt: new Date(),
      verificationUrl,
    });

    await certificate.save();

    logger.info('Certificate generated', { certificateId, userId, courseId });

    res.status(201).json({
      message: 'Certificate generated successfully',
      data: certificate,
    });
  } catch (error) {
    logger.error('Error generating certificate', { userId, courseId, error });
    res.status(500).json({
      message: 'Error generating certificate',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

// ─── Get Certificate ────────────────────────────────────────────────────────────

export const getCertificate = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { certificateId } = req.params;

  try {
    const certificate = await Certificate.findOne({ certificateId });
    if (!certificate) {
      res.status(404).json({ message: 'Certificate not found' });
      return;
    }

    res.status(200).json({
      message: 'Certificate retrieved successfully',
      data: certificate,
    });
  } catch (error) {
    logger.error('Error fetching certificate', { certificateId, error });
    res.status(500).json({
      message: 'Error retrieving certificate',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

// ─── Verify Certificate (Public) ────────────────────────────────────────────────

export const verifyCertificate = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { certificateId } = req.params;

  try {
    const certificate = await Certificate.findOne({ certificateId });
    if (!certificate) {
      res.status(404).json({
        message: 'Certificate not found',
        valid: false,
      });
      return;
    }

    res.status(200).json({
      message: 'Certificate is valid',
      valid: true,
      data: {
        certificateId: certificate.certificateId,
        courseName: certificate.courseName,
        userName: certificate.userName,
        issuedAt: certificate.issuedAt,
        verificationUrl: certificate.verificationUrl,
      },
    });
  } catch (error) {
    logger.error('Error verifying certificate', { certificateId, error });
    res.status(500).json({
      message: 'Error verifying certificate',
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

// ─── Get User Certificates ──────────────────────────────────────────────────────

export const getUserCertificates = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.params;
  const auth = getAuth(req);

  if (!auth || auth.userId !== userId) {
    res.status(403).json({ message: 'Access denied' });
    return;
  }

  try {
    const certificates = await Certificate.find({ userId }).sort({
      issuedAt: -1,
    });

    res.status(200).json({
      message: 'User certificates retrieved successfully',
      data: certificates,
    });
  } catch (error) {
    logger.error('Error fetching user certificates', { userId, error });
    res.status(500).json({
      message: 'Error retrieving user certificates',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

// ─── Download Certificate PDF ───────────────────────────────────────────────────

export const downloadCertificate = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { certificateId } = req.params;

  try {
    const certificate = await Certificate.findOne({ certificateId });
    if (!certificate) {
      res.status(404).json({ message: 'Certificate not found' });
      return;
    }

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(certificate.verificationUrl, {
      width: 120,
      margin: 1,
      color: { dark: '#1a1a2e', light: '#ffffff' },
    });

    // Create PDF
    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 60, right: 60 },
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="certificate-${certificate.certificateId}.pdf"`
    );

    doc.pipe(res);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // Background - gradient-like effect
    doc.rect(0, 0, pageWidth, pageHeight).fill('#fefefe');

    // Border
    const borderMargin = 30;
    doc
      .rect(
        borderMargin,
        borderMargin,
        pageWidth - borderMargin * 2,
        pageHeight - borderMargin * 2
      )
      .lineWidth(3)
      .stroke('#1a1a2e');

    // Inner border
    const innerMargin = 40;
    doc
      .rect(
        innerMargin,
        innerMargin,
        pageWidth - innerMargin * 2,
        pageHeight - innerMargin * 2
      )
      .lineWidth(1)
      .stroke('#c4a35a');

    // Header decoration
    doc
      .fontSize(14)
      .font('Helvetica')
      .fillColor('#c4a35a')
      .text('★ ★ ★', 0, 60, { align: 'center' });

    // Title
    doc
      .fontSize(36)
      .font('Helvetica-Bold')
      .fillColor('#1a1a2e')
      .text('Certificate of Completion', 0, 90, { align: 'center' });

    // Subtitle
    doc
      .fontSize(14)
      .font('Helvetica')
      .fillColor('#666666')
      .text('This is to certify that', 0, 150, { align: 'center' });

    // Student name
    doc
      .fontSize(32)
      .font('Helvetica-Bold')
      .fillColor('#1a1a2e')
      .text(certificate.userName, 0, 180, { align: 'center' });

    // Decorative line under name
    const nameWidth = doc.widthOfString(certificate.userName);
    const lineX = (pageWidth - Math.min(nameWidth + 40, 400)) / 2;
    doc
      .moveTo(lineX, 220)
      .lineTo(lineX + Math.min(nameWidth + 40, 400), 220)
      .lineWidth(1)
      .stroke('#c4a35a');

    // Completion text
    doc
      .fontSize(14)
      .font('Helvetica')
      .fillColor('#666666')
      .text('has successfully completed the course', 0, 240, {
        align: 'center',
      });

    // Course name
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor('#2d3748')
      .text(certificate.courseName, 60, 270, {
        align: 'center',
        width: pageWidth - 120,
      });

    // Date
    const formattedDate = certificate.issuedAt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#888888')
      .text(`Issued on ${formattedDate}`, 0, 330, { align: 'center' });

    // Certificate ID
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#aaaaaa')
      .text(`Certificate ID: ${certificate.certificateId}`, 0, 355, {
        align: 'center',
      });

    // QR Code
    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
    doc.image(qrBuffer, pageWidth - 180, pageHeight - 170, {
      width: 100,
      height: 100,
    });
    doc
      .fontSize(8)
      .fillColor('#888888')
      .text('Scan to verify', pageWidth - 180, pageHeight - 65, {
        width: 100,
        align: 'center',
      });

    // Footer decoration
    doc
      .fontSize(14)
      .font('Helvetica')
      .fillColor('#c4a35a')
      .text('★ ★ ★', 0, pageHeight - 80, { align: 'center' });

    // Platform name
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#888888')
      .text('Learn Now - Learning Management System', 0, pageHeight - 60, {
        align: 'center',
      });

    doc.end();

    logger.info('Certificate PDF downloaded', { certificateId });
  } catch (error) {
    logger.error('Error downloading certificate', { certificateId, error });
    res.status(500).json({
      message: 'Error downloading certificate',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
