export function calculateBmi(heightCm, weightKg) {
  if (!heightCm || !weightKg) {
    return null;
  }

  const heightInMeters = heightCm / 100;
  const bmi = weightKg / (heightInMeters * heightInMeters);
  return Number(bmi.toFixed(1));
}
