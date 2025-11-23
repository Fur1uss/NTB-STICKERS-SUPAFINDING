class ModerationService {
  constructor() {
    this.isModelLoaded = false;
    this.model = null;
  }

  isBrowser() {
    return typeof window !== 'undefined';
  }

  async checkImage(file) {
    if (!this.isBrowser()) {
      return { isAppropriate: true, confidence: 1, reason: 'Server-side skip' };
    }

    return { isAppropriate: true, confidence: 1, reason: 'Client-side mock' };
  }

  isReady() {
    return this.isBrowser() && this.isModelLoaded;
  }
}

export default ModerationService;
