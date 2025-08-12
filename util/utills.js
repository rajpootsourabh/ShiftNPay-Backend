exports.calculateEarnings = (hourlyRate, totalSeconds) => {
    const secondsInAnHour = 3600;
    const perSecondRate = hourlyRate / secondsInAnHour;
    const earnings = perSecondRate * totalSeconds;
    return earnings.toFixed(2);
};