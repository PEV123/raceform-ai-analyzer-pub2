export const formatRaceContext = (race: any) => {
  const raceDetails = `
Race Details:
- Name: ${race.race_name}
- Course: ${race.course}
- Time: ${race.off_time}
- Class: ${race.race_class}
- Age Band: ${race.age_band}
- Rating Band: ${race.rating_band}
- Prize: ${race.prize}
- Field Size: ${race.field_size} runners
- Distance: ${race.distance_round || race.distance}
- Going: ${race.going}
- Surface: ${race.surface}
- Type: ${race.type}
${race.jumps ? `- Jumps: ${race.jumps}` : ''}

Runners:
${race.runners?.map((runner: any) => `
${runner.number}. ${runner.horse} (${runner.draw})
- Jockey: ${runner.jockey}
- Trainer: ${runner.trainer} (14 day form: ${runner.trainer_14_days?.wins}/${runner.trainer_14_days?.runs} - ${runner.trainer_14_days?.percent}%)
- Weight: ${runner.lbs}lbs
- Form: ${runner.form || 'No form'}
- Official Rating: ${runner.ofr || 'N/A'}
- Breeding: ${runner.sire} (${runner.sire_region}) x ${runner.dam} (${runner.dam_region})
- Last Run: ${runner.last_run || 'N/A'} days ago
${runner.medical?.length ? `- Medical History: ${runner.medical.map((m: any) => `${m.type} (${m.date})`).join(', ')}` : ''}
${runner.wind_surgery ? '- Has had wind surgery' : ''}
${runner.headgear ? `- Wearing: ${runner.headgear}` : ''}
${runner.comment ? `- Comment: ${runner.comment}` : ''}
${runner.spotlight ? `- Spotlight: ${runner.spotlight}` : ''}
${runner.quotes?.length ? `\nQuotes:\n${runner.quotes.map((q: any) => `"${q.quote}"`).join('\n')}` : ''}
${runner.stable_tour?.length ? `\nStable Tour:\n${runner.stable_tour.map((t: any) => `"${t.quote}"`).join('\n')}` : ''}
`).join('\n')}
`;

  return raceDetails;
};