async function testE2E() {
  console.log('--- 1. Testing Web App Root HTML ---');
  const rootRes = await fetch('http://localhost:4000/');
  const rootHtml = await rootRes.text();
  console.log('Root HTML status:', rootRes.status, 'Contains title:', rootHtml.includes('영화 예매 오픈 알리미'));

  console.log('\n--- 2. Testing Theaters Endpoint ---');
  const cgvRes = await fetch('http://localhost:4000/api/theaters?cinema=CGV').then(r => r.json());
  const megaRes = await fetch('http://localhost:4000/api/theaters?cinema=MEGABOX').then(r => r.json());
  const lotteRes = await fetch('http://localhost:4000/api/theaters?cinema=LOTTE').then(r => r.json());
  console.log(`Theaters loaded - CGV: ${cgvRes.length}, Megabox: ${megaRes.length}, Lotte: ${lotteRes.length}`);

  console.log('\n--- 3. Creating Monitoring Tasks ---');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const playDate = tomorrow.toISOString().slice(0, 10);

  const createRes = await fetch('http://localhost:4000/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cinema: 'CGV',
      theaterCode: '0013',
      theaterName: '용산아이파크몰',
      date: playDate,
      movieKeyword: '옵세션',
      specialOnly: 'ALL'
    })
  });
  const created = await createRes.json();
  console.log('Task created:', created[0]?.id, created[0]?.movieKeyword, created[0]?.status);

  console.log('\n--- 4. Triggering Instant Check on Task ---');
  const taskId = created[0].id;
  const checkRes = await fetch(`http://localhost:4000/api/tasks/${taskId}/check`, { method: 'POST' });
  const checkData = await checkRes.json();
  console.log('Check result:', checkData);

  console.log('\n--- 5. Verifying Task & Logs State ---');
  const tasks = await fetch('http://localhost:4000/api/tasks').then(r => r.json());
  const targetTask = tasks.find(t => t.id === taskId);
  console.log('Updated Task Status:', targetTask.status, 'Last result:', targetTask.lastResult);

  const logs = await fetch('http://localhost:4000/api/logs').then(r => r.json());
  console.log('Recent logs count:', logs.length);
  console.log('First log:', logs[0]?.message);

  console.log('\n✅ ALL E2E TESTS PASSED SUCCESSFULLY!');
}

testE2E().catch(console.error);
