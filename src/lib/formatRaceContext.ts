export const formatRaceContext = (race: any) => {
  if (!race) {
    return "No race data available";
  }

  const raceDetails = `
Race Details:
- Name: ${race.race_name || 'N/A'}
- Course: ${race.course || 'N/A'}
- Time: ${race.off_time || 'N/A'}
- Class: ${race.race_class || 'N/A'}
- Age Band: ${race.age_band || 'N/A'}
- Rating Band: ${race.rating_band || 'N/A'}
- Prize: ${race.prize || 'N/A'}
- Field Size: ${race.field_size || 0} runners
- Distance: ${race.distance_round || race.distance || 'N/A'}
- Going: ${race.going || 'N/A'}
- Surface: ${race.surface || 'N/A'}
- Type: ${race.type || 'N/A'}
${race.jumps ? `- Jumps: ${race.jumps}` : ''}

Runners:
${race.runners?.map((runner: any) => `
${runner.number || 'N/A'}. ${runner.horse || 'N/A'} (${runner.draw || 'N/A'})
- Jockey: ${runner.jockey || 'N/A'}
- Trainer: ${runner.trainer || 'N/A'} ${runner.trainer_14_days ? `(14 day form: ${runner.trainer_14_days.wins || 0}/${runner.trainer_14_days.runs || 0} - ${runner.trainer_14_days.percent || 0}%)` : ''}
- Weight: ${runner.lbs || 'N/A'}lbs
- Form: ${runner.form || 'No form'}
- Official Rating: ${runner.ofr || 'N/A'}
- Breeding: ${runner.sire || 'N/A'} (${runner.sire_region || 'N/A'}) x ${runner.dam || 'N/A'} (${runner.dam_region || 'N/A'})
- Last Run: ${runner.last_run || 'N/A'} days ago
${runner.medical?.length ? `- Medical History: ${runner.medical.map((m: any) => `${m.type} (${m.date})`).join(', ')}` : ''}
${runner.wind_surgery ? '- Has had wind surgery' : ''}
${runner.headgear ? `- Wearing: ${runner.headgear}` : ''}
${runner.comment ? `- Comment: ${runner.comment}` : ''}
${runner.spotlight ? `- Spotlight: ${runner.spotlight}` : ''}
${runner.quotes?.length ? `\nQuotes:\n${runner.quotes.map((q: any) => `"${q.quote}"`).join('\n')}` : ''}
${runner.stable_tour?.length ? `\nStable Tour:\n${runner.stable_tour.map((t: any) => `"${t.quote}"`).join('\n')}` : ''}
`).join('\n') || 'No runners data available'}
`;

  return raceDetails;
};