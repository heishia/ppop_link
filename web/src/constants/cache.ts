export const CACHE_CONFIG = {
  DEFAULT: 30 * 60 * 1000,
  
  PROFILE: 30 * 60 * 1000,
  LINKS: 30 * 60 * 1000,
  SOCIAL_LINKS: 30 * 60 * 1000,
  
  get DEVELOPMENT() {
    return process.env.NODE_ENV === 'development' ? 30 * 1000 : this.DEFAULT;
  }
} as const;

