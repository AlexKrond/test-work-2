module.exports = {
  playTypes: {

    tragedy: {
      amount: {
        basic: 40000,
        perViewerUntilBoundary: 0,
        viewerBoundary: 30,
        additionalAfterBoundary: 0,
        perViewerAfterBoundary: 1000,
      },
    },

    comedy: {
      amount: {
        basic: 30000,
        perViewerUntilBoundary: 300,
        viewerBoundary: 20,
        additionalAfterBoundary: 10000,
        perViewerAfterBoundary: 800,
      },
    },

  },
  getVolumeCredits(audience) {
    const audienceBoundary = 30;
    return Math.max(audience - audienceBoundary, 0);
  },
  getAdditionalVolumeCredits(playTypesCounter) {
    const bonuses = {
      comedy: {
        amount: 100,
        forEvery: 10,
      },
    };

    let additionalVolumeCredits = 0;
    for (let type in bonuses) {
      if (bonuses.hasOwnProperty(type)) {
        if (playTypesCounter.has(type)) {
          const count = playTypesCounter.get(type);
          const bonus = bonuses[type];
          additionalVolumeCredits += bonus.amount * Math.floor(count / bonus.forEvery);
        }
      }
    }

    return additionalVolumeCredits;
  }
};
