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
      console.log('ModerationService: Server-side detected, skipping moderation');
      return { isAppropriate: true, confidence: 1, reason: 'Server-side skip' };
    }

    console.log('ModerationService: Checking image...');
    return { isAppropriate: true, confidence: 1, reason: 'Client-side mock' };
  }

  isReady() {
    return this.isBrowser() && this.isModelLoaded;
  }
}

export default ModerationService;
