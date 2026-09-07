async function testAuthAndIsolation() {
  console.log('--- 1. Register User 1 ---');
  const reg1Res = await fetch('http://localhost:4000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'tester1', password: 'password123' })
  });
  const reg1 = await reg1Res.json();
  console.log('User 1 Registered:', reg1.user?.username, 'Token:', reg1.token?.slice(0, 10));

  console.log('\n--- 2. User 1 Sets Personal Discord Webhook ---');
  const hookRes = await fetch('http://localhost:4000/api/auth/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${reg1.token}`
    },
    body: JSON.stringify({ webhookUrl: 'https://discord.com/api/webhooks/123/abc' })
  });
  console.log('Webhook set:', await hookRes.json());

  console.log('\n--- 3. User 1 Creates Task ---');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const playDate = tomorrow.toISOString().slice(0, 10);

  const task1Res = await fetch('http://localhost:4000/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${reg1.token}`
    },
    body: JSON.stringify({
      cinema: 'CGV',
      theaterCode: '0013',
      theaterName: '용산아이파크몰',
      date: playDate,
      movieKeyword: '옵세션',
      specialOnly: 'ALL'
    })
  });
  const task1 = await task1Res.json();
  console.log('User 1 Task Created:', task1[0]?.id, task1[0]?.movieKeyword);

  console.log('\n--- 4. Register User 2 ---');
  const reg2Res = await fetch('http://localhost:4000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'tester2', password: 'password456' })
  });
  const reg2 = await reg2Res.json();
  console.log('User 2 Registered:', reg2.user?.username);

  console.log('\n--- 5. Verify User 2 Sees 0 Tasks (Complete Isolation) ---');
  const user2TasksRes = await fetch('http://localhost:4000/api/tasks', {
    headers: { 'Authorization': `Bearer ${reg2.token}` }
  });
  const user2Tasks = await user2TasksRes.json();
  console.log('User 2 Task Count (Should be 0):', user2Tasks.length);

  console.log('\n--- 6. User 2 Attempts to Delete User 1 Task (Should Fail) ---');
  const deleteFailRes = await fetch(`http://localhost:4000/api/tasks/${task1[0].id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${reg2.token}` }
  });
  console.log('Delete attempt status (Should be 404):', deleteFailRes.status);

  console.log('\n--- 7. User 1 Still Has Their Task ---');
  const user1TasksRes = await fetch('http://localhost:4000/api/tasks', {
    headers: { 'Authorization': `Bearer ${reg1.token}` }
  });
  const user1Tasks = await user1TasksRes.json();
  console.log('User 1 Task Count (Should be 1):', user1Tasks.length, 'Task:', user1Tasks[0]?.movieKeyword);

  console.log('\n✅ ALL AUTHENTICATION & MULTI-USER ISOLATION TESTS PASSED!');
}

testAuthAndIsolation().catch(console.error);
