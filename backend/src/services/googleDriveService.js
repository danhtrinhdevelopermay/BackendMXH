async function getUncachableGoogleDriveClient() {
  const { google } = require('googleapis');
  
  let connectionSettings;

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-drive',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Drive not connected');
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

async function uploadBackupToDrive(userId, backupData, metadata) {
  try {
    const drive = await getUncachableGoogleDriveClient();
    
    const fileName = `zalo_backup_${userId}_${Date.now()}.json`;
    const fileMetadata = {
      name: fileName,
      description: metadata.description || 'Zalo Message Backup',
      appProperties: {
        userId: userId.toString(),
        backupDate: new Date().toISOString(),
        version: '1.0'
      }
    };

    const media = {
      mimeType: 'application/json',
      body: backupData
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, createdTime, size'
    });

    return {
      success: true,
      fileId: response.data.id,
      fileName: response.data.name,
      createdTime: response.data.createdTime,
      size: response.data.size
    };
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw error;
  }
}

async function listBackupsFromDrive(userId) {
  try {
    const drive = await getUncachableGoogleDriveClient();
    
    const response = await drive.files.list({
      q: `appProperties has { key='userId' and value='${userId}' } and trashed=false`,
      fields: 'files(id, name, createdTime, size, appProperties)',
      orderBy: 'createdTime desc',
      pageSize: 20
    });

    return {
      success: true,
      backups: response.data.files || []
    };
  } catch (error) {
    console.error('Error listing backups from Google Drive:', error);
    throw error;
  }
}

async function downloadBackupFromDrive(fileId) {
  try {
    const drive = await getUncachableGoogleDriveClient();
    
    const response = await drive.files.get({
      fileId: fileId,
      alt: 'media'
    }, {
      responseType: 'stream'
    });

    return new Promise((resolve, reject) => {
      let data = '';
      response.data.on('data', chunk => {
        data += chunk.toString();
      });
      response.data.on('end', () => {
        try {
          const backup = JSON.parse(data);
          resolve({
            success: true,
            backup
          });
        } catch (error) {
          reject(new Error('Invalid backup format'));
        }
      });
      response.data.on('error', reject);
    });
  } catch (error) {
    console.error('Error downloading backup from Google Drive:', error);
    throw error;
  }
}

async function deleteBackupFromDrive(fileId) {
  try {
    const drive = await getUncachableGoogleDriveClient();
    
    await drive.files.delete({
      fileId: fileId
    });

    return {
      success: true,
      message: 'Backup deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting backup from Google Drive:', error);
    throw error;
  }
}

module.exports = {
  uploadBackupToDrive,
  listBackupsFromDrive,
  downloadBackupFromDrive,
  deleteBackupFromDrive
};
