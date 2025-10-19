const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const REPO_OWNER = process.env.GITHUB_REPO_OWNER;
const REPO_NAME = process.env.GITHUB_REPO_NAME;

async function uploadAPKtoGitHub(apkFilePath, versionName, versionCode, releaseNotes) {
  try {
    console.log(`📤 Uploading APK v${versionName} to GitHub Releases...`);
    
    const tagName = `v${versionName}`;
    
    let release;
    try {
      const { data } = await octokit.repos.getReleaseByTag({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        tag: tagName,
      });
      release = data;
      console.log(`✅ Release ${tagName} already exists, will update it`);
    } catch (error) {
      const { data } = await octokit.repos.createRelease({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        tag_name: tagName,
        name: `Shatter ${versionName}`,
        body: releaseNotes || `Release version ${versionName} (code: ${versionCode})`,
        draft: false,
        prerelease: false,
      });
      release = data;
      console.log(`✅ Created new release ${tagName}`);
    }

    const apkBuffer = fs.readFileSync(apkFilePath);
    const fileName = `shatter-${versionName}.apk`;

    const { data: uploadedAsset } = await octokit.repos.uploadReleaseAsset({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      release_id: release.id,
      name: fileName,
      data: apkBuffer,
      headers: {
        'content-type': 'application/vnd.android.package-archive',
        'content-length': apkBuffer.length,
      },
    });

    console.log(`✅ APK uploaded successfully to GitHub: ${uploadedAsset.browser_download_url}`);
    
    return {
      success: true,
      downloadUrl: uploadedAsset.browser_download_url,
      releaseUrl: release.html_url,
    };
  } catch (error) {
    console.error('❌ Error uploading to GitHub:', error);
    throw error;
  }
}

async function deleteAPKfromGitHub(versionName) {
  try {
    console.log(`🗑️ Deleting APK v${versionName} from GitHub Releases...`);
    
    const tagName = `v${versionName}`;
    
    const { data: release } = await octokit.repos.getReleaseByTag({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      tag: tagName,
    });

    await octokit.repos.deleteRelease({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      release_id: release.id,
    });

    try {
      await octokit.git.deleteRef({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        ref: `tags/${tagName}`,
      });
    } catch (error) {
      console.warn('Could not delete tag:', error.message);
    }

    console.log(`✅ Deleted release ${tagName} from GitHub`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting from GitHub:', error);
    throw error;
  }
}

module.exports = {
  uploadAPKtoGitHub,
  deleteAPKfromGitHub,
};
