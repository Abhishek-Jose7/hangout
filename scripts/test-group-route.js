// scripts/test-group-route.js
async function testGetGroups() {
  try {
    // We need to create a group first to ensure the endpoint returns data.
    // We can do this by calling the POST endpoint.
    console.log('Attempting to create a new group...');
    const createGroupResponse = await fetch('http://localhost:3000/api/groups', { method: 'POST' });
    if (!createGroupResponse.ok) {
        throw new Error(`HTTP error! status: ${createGroupResponse.status}`);
    }
    const groupData = await createGroupResponse.json();
    console.log('Created group:', groupData);

    console.log('\nAttempting to fetch all groups...');
    const response = await fetch('http://localhost:3000/api/groups');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Response from /api/groups:', data);
    if (data.success && Array.isArray(data.groups) && data.groups.length > 0) {
      console.log('Vulnerability confirmed: /api/groups returned group data without authentication.');
    } else if (data.success && Array.isArray(data.groups) && data.groups.length === 0) {
        console.log("The endpoint is secured or there is no data.");
    }
    else {
      console.log('The endpoint did not return a successful response with a groups array.');
    }
  } catch (error) {
    console.error('Error fetching /api/groups:', error);
  }
}

testGetGroups();
