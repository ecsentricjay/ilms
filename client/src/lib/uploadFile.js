import api from './api';

export async function uploadFile(file, bucket) {
  // 1. Get signed upload URL from our backend
  const { data } = await api.post('/upload/signed-url', {
    bucket,
    fileName: file.name,
    contentType: file.type
  });

  // 2. Upload directly to Supabase Storage
  const uploadRes = await fetch(data.signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file
  });

  if (!uploadRes.ok) {
    throw new Error('File upload failed');
  }

  return data.publicUrl;
}
