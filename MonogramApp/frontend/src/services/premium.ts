export const PREMIUM_FEATURES = {
  free: {
    customWallpapers: 10,
    customReactions: false,
    premiumBadge: false,
    storiesPerDay: 1,
    businessProfile: false,
    emojiStatus: false,
  },
  premium: {
    customWallpapers: Infinity,
    customReactions: true,
    premiumBadge: true,
    storiesPerDay: Infinity,
    businessProfile: true,
    emojiStatus: true,
  },
};

export const PREMIUM_PRICES = {
  monthly: 49,
  yearly: 499,
};

export const checkPremium = async (userId: number): Promise<boolean> => {
  try {
    const { default: api } = await import('./api');
    const res = await api.get(`/premium/check/${userId}`);
    return res.data.is_premium === true;
  } catch {
    return false;
  }
};