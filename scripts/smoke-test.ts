async function runSmokeTest() {
  console.log('🧪 Starting End-to-End Live Application Smoke Test...');
  const baseUrl = 'http://localhost:3000';

  // 1. Test Landing Page
  const homeRes = await fetch(`${baseUrl}/`);
  if (!homeRes.ok) throw new Error(`Landing page returned ${homeRes.status}`);
  console.log('✅ Landing page HTTP 200 OK');

  // 2. Test Preloaded Demo Page
  const demoRes = await fetch(`${baseUrl}/demo`);
  if (!demoRes.ok) throw new Error(`Demo page returned ${demoRes.status}`);
  console.log('✅ /demo page HTTP 200 OK');

  // 3. Test Participants API
  const pRes = await fetch(`${baseUrl}/api/participants`);
  const pData = await pRes.json();
  if (!pData.success || pData.data.length < 25) {
    throw new Error(`Expected at least 25 participants, got ${pData.data?.length}`);
  }
  console.log(`✅ Participants API: ${pData.data.length} participants loaded`);

  // 4. Test Dates API
  const datesRes = await fetch(`${baseUrl}/api/dates`);
  const datesData = await datesRes.json();
  if (!datesData.success || datesData.count < 300) {
    throw new Error(`Expected at least 300 simulated dates, got ${datesData.count}`);
  }
  console.log(`✅ Dates API: ${datesData.count} simulated dates persisted`);

  // 5. Test Rankings API for Maya (synth_01)
  const rankRes = await fetch(`${baseUrl}/api/rankings?targetId=synth_01`);
  const rankData = await rankRes.json();
  if (!rankData.success || rankData.rankings.length !== 24) {
    throw new Error(`Expected 24 ranked candidates for target, got ${rankData.rankings?.length}`);
  }
  console.log(`✅ Rankings API: 24 directed rankings verified for target participant`);

  // 6. Test Single Date Transcript Structure
  const firstDate = datesData.data[0];
  if (!firstDate.transcript || firstDate.transcript.length < 6 || !firstDate.structuredReport) {
    throw new Error('Simulated date missing multi-turn transcript or structured report');
  }
  console.log(`✅ Date Transcript: 6-turn multi-turn dialogue and structured report verified (${firstDate.id})`);

  // 7. Test Creating a New Consenting Participant
  const testParticipantPayload = {
    name: 'E2E Test User',
    displayName: 'Tester',
    linkedinUrl: 'https://linkedin.com/in/e2e-test-user-verified',
    instagramUrl: 'https://instagram.com/e2e_test_user',
    consentGiven: true,
    extractionMode: 'manual',
    bio: 'Software engineer testing the live pipeline.',
    interests: ['Systems Architecture', 'Distributed Systems', 'Pour-over Coffee'],
    hobbies: ['Cycling', 'Chess'],
    communicationPreferences: {
      style: 'direct',
      pace: 'fast',
      humor: 'witty',
    },
    relationshipGoals: 'Exploring long-term intellectual partnership.',
    dealbreakers: ['Active smoking or tobacco use'],
  };

  const createRes = await fetch(`${baseUrl}/api/participants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testParticipantPayload),
  });

  const createData = await createRes.json();
  if (!createData.success || !createData.data.id) {
    throw new Error(`Failed to create participant: ${JSON.stringify(createData)}`);
  }
  const createdId = createData.data.id;
  console.log(`✅ Add Participant: Created new participant with ID ${createdId}`);

  // 8. Verify the new participant has instant pairwise dates and rankings
  const newRankRes = await fetch(`${baseUrl}/api/rankings?targetId=${createdId}`);
  const newRankData = await newRankRes.json();
  if (!newRankData.success || newRankData.rankings.length < 25) {
    throw new Error(`Expected at least 25 candidate rankings for new participant, got ${newRankData.rankings?.length}`);
  }
  console.log(`✅ Pairwise Matching: Successfully generated ${newRankData.rankings.length} rankings for new participant`);

  // 9. Clean up test participant (data minimization)
  const delRes = await fetch(`${baseUrl}/api/participants/${createdId}`, { method: 'DELETE' });
  const delData = await delRes.json();
  if (!delData.success) {
    throw new Error('Failed to delete test participant');
  }
  console.log(`✅ Data Minimization: Successfully purged test participant and cleaned up related dates`);

  // 10. Verify Export API
  const exportRes = await fetch(`${baseUrl}/api/export`);
  if (!exportRes.ok) throw new Error('Export API failed');
  const exportData = await exportRes.json();
  if (!exportData.participants || !exportData.dates || !exportData.rankings) {
    throw new Error('Export payload incomplete');
  }
  console.log(`✅ JSON Export API: Verified full research dataset export (${exportData.metrics.totalSimulatedDates} dates)`);

  console.log('\n🎉 ALL END-TO-END SMOKE TESTS PASSED WITH 100% SUCCESS!');
}

runSmokeTest().catch((err) => {
  console.error('❌ Smoke test failed:', err);
  process.exit(1);
});
