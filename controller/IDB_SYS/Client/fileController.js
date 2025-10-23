const fileUploadService = require('../../../util/secureFileUpload'); 
const path = require('path');
const fs = require('fs').promises;
const Models = require('../../../model/index')

class FileController {
  // Secure file download
  async downloadFile(req, res) {
    try {
      const { clientId, filename } = req.params;
      const user = req.user;

      // Verify user has access to this client's files
      const client = await Models.Client.findOne({
        _id: clientId,
        vendorId: user._id
      });
      
      if (!client) {
        return res.status(404).json({ message: 'Client not found or access denied' });
      }

      // Find the specific attachment in client record
      const attachment = client.attachments.find(
        att => att.fileName === filename
      );
      
      if (!attachment) {
        return res.status(404).json({ message: 'File not found' });
      }

      const filePath = path.join(fileUploadService.uploadBasePath, attachment.filePath);
      
      // Verify file exists
      try {
        await fs.access(filePath);
      } catch {
        return res.status(404).json({ message: 'File not found on server' });
      }

      // Set appropriate headers
      res.setHeader('Content-Type', attachment.fileType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName || attachment.fileName}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      fileStream.on('error', (error) => {
        console.error('File stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error streaming file' });
        }
      });

    } catch (error) {
      console.error('File download error:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  }

  // Secure file preview
  async previewFile(req, res) {
    try {
      const { clientId, filename } = req.params;
      const user = req.user;

      // Verify access rights
      const client = await Models.Client.findOne({
        _id: clientId,
        vendorId: user._id
      });
      
      if (!client) {
        return res.status(404).json({ message: 'Client not found or access denied' });
      }

      const attachment = client.attachments.find(
        att => att.fileName === filename
      );
      
      if (!attachment) {
        return res.status(404).json({ message: 'File not found' });
      }

      // Check if file type is safe for preview
      const safePreviewTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'text/plain'
      ];
      
      if (!safePreviewTypes.includes(attachment.fileType)) {
        return res.status(400).json({ message: 'File type not supported for preview' });
      }

      const filePath = path.join(fileUploadService.uploadBasePath, attachment.filePath);
      
      try {
        await fs.access(filePath);
      } catch {
        return res.status(404).json({ message: 'File not found on server' });
      }

      // Set security headers for preview
      res.setHeader('Content-Type', attachment.fileType);
      res.setHeader('Content-Disposition', `inline; filename="${attachment.originalName || attachment.fileName}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      // For images and PDFs, add additional security headers
      if (attachment.fileType.startsWith('image/') || attachment.fileType === 'application/pdf') {
        res.setHeader('X-Frame-Options', 'DENY'); // Prevent clickjacking
      }

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      fileStream.on('error', (error) => {
        console.error('File preview error:', error);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error previewing file' });
        }
      });

    } catch (error) {
      console.error('File preview error:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  }

  // Delete file
  async deleteFile(req, res) {
    try {
      const { clientId, filename } = req.params;
      const user = req.user;

      const client = await Models.Client.findOne({
        _id: clientId,
        vendorId: user._id
      });
      
      if (!client) {
        return res.status(404).json({ message: 'Client not found or access denied' });
      }

      const attachmentIndex = client.attachments.findIndex(
        att => att.fileName === filename
      );
      
      if (attachmentIndex === -1) {
        return res.status(404).json({ message: 'File not found' });
      }

      const attachment = client.attachments[attachmentIndex];
      
      // Delete physical file
      const deleteSuccess = await fileUploadService.deleteFile(
        attachment.filePath, 
        user._id, 
        clientId
      );
      
      if (!deleteSuccess) {
        return res.status(500).json({ message: 'Error deleting file from storage' });
      }

      // Remove from database
      client.attachments.splice(attachmentIndex, 1);
      await client.save();

      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      console.error('File deletion error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}

module.exports = new FileController();