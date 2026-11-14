export const resolveAvatar = ({ userId, url, name }, currentUser) => {
  const id = typeof userId === 'object' ? userId?._id : userId;
  const own = id && currentUser?._id && String(id) === String(currentUser._id);
  return {
    url: own ? currentUser.profile?.avatar || null : url || null,
    name: own ? currentUser.profile?.fullName || name : name,
  };
};

export const avatarFile = asset => {
  if (!asset?.uri) throw new Error('Please select a photo.');
  if (asset.fileSize > 5 * 1024 * 1024) throw new Error('Photo must be 5MB or smaller.');
  const ext = (asset.fileName || asset.uri.split('?')[0]).split('.').pop().toLowerCase();
  const type = asset.mimeType || ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' })[ext];
  if (!['image/jpeg', 'image/jpg', 'image/png'].includes(type)) throw new Error('Please select a JPG or PNG photo.');
  return { uri: asset.uri, type: type === 'image/jpg' ? 'image/jpeg' : type, name: type === 'image/png' ? 'avatar.png' : 'avatar.jpg' };
};

export const profileError = error => error?.errors?.map(item => item.message || item.msg).filter(Boolean).join('\n') || error?.error || error?.message || 'Unable to update profile. Please try again.';
