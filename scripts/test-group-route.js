(async ()=>{
  const path = require('path');
  const route = require(path.join(__dirname,'..','src','app','api','groups','[code]','route.ts'));
  // Simulate NextRequest and params
  const fakeRequest = {};
  const fakeParams = Promise.resolve({ code: 'ABC123' });
  try{
    const res = await route.GET(fakeRequest, { params: fakeParams });
    console.log('Route response object:', res);
  } catch (e) {
    console.error('Exception invoking route.GET:', e);
  }
})();
