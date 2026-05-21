const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { authenticate } = require('../middleware/auth');

// POST /api/upload/signed-url — Get a signed upload URL for Supabase Storage
router.post('/signed-url', authenticate, async (req, res) => {
  const { bucket, fileName, contentType } = req.body;
  if (!bucket || !fileName || !contentType) {
    return res.status(400).json({ error: 'bucket, fileName, and contentType required' });
  }

  const allowedBuckets = ['course-materials', 'submissions'];
  if (!allowedBuckets.includes(bucket)) {
    return res.status(400).json({ error: 'Invalid bucket' });
  }

  try {
    const filePath = `${req.user.id}/${Date.now()}-${fileName}`;
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(filePath);

    if (error) return res.status(400).json({ error: error.message });

    // Build the public URL
    const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`;

    res.json({ signedUrl: data.signedUrl, filePath, publicUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
