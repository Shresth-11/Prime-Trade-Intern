import logger from './src/utils/logger.js';

const BASE_URL = 'http://localhost:3000/api/v1';

// Test variables
let userToken = '';
let adminToken = '';
let taskId = '';
let userIdToPromote = '';

async function runTests() {
  logger.info('==================================================');
  logger.info('   STARTING REST API PROGRAMMATIC INTEGRATION TESTS');
  logger.info('==================================================');

  try {
    // 1. REGISTER STANDARD USER
    logger.info('TEST 1: Register Standard User');
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Standard User',
        email: 'tester.standard@example.com',
        password: 'password123',
        role: 'user'
      })
    });
    const regData = await regRes.json();
    if (regRes.status === 201) {
      logger.info('✅ Success: User registered successfully.');
      userIdToPromote = regData.data.user.id;
    } else {
      logger.warn(`⚠️ Warning: Registration returned status ${regRes.status}: ${regData.message}`);
    }

    // 2. REGISTER ADMIN USER
    logger.info('TEST 2: Register Admin User');
    const adminRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Admin User',
        email: 'tester.admin@example.com',
        password: 'password123',
        role: 'admin'
      })
    });
    const adminRegData = await adminRegRes.json();
    if (adminRegRes.status === 201) {
      logger.info('✅ Success: Admin registered successfully.');
    } else {
      logger.warn(`⚠️ Warning: Admin registration returned status ${adminRegRes.status}: ${adminRegData.message}`);
    }

    // 3. LOGIN STANDARD USER
    logger.info('TEST 3: Login Standard User');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'tester.standard@example.com',
        password: 'password123'
      })
    });
    const loginData = await loginRes.json();
    if (loginRes.status === 200) {
      userToken = loginData.token;
      logger.info('✅ Success: Logged in. Token retrieved.');
    } else {
      throw new Error(`Failed to log in: ${loginData.message}`);
    }

    // 4. LOGIN ADMIN USER
    logger.info('TEST 4: Login Admin User');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'tester.admin@example.com',
        password: 'password123'
      })
    });
    const adminLoginData = await adminLoginRes.json();
    if (adminLoginRes.status === 200) {
      adminToken = adminLoginData.token;
      logger.info('✅ Success: Admin logged in. Token retrieved.');
    } else {
      throw new Error(`Failed to log in Admin: ${adminLoginData.message}`);
    }

    // 5. CREATE TASK (STANDARD USER)
    logger.info('TEST 5: Create Task with Standard User Token');
    const createTaskRes = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        title: 'Complete Integration Testing',
        description: 'Ensure backend endpoints respond correctly.',
        status: 'pending'
      })
    });
    const createTaskData = await createTaskRes.json();
    if (createTaskRes.status === 201) {
      taskId = createTaskData.data.task.id;
      logger.info(`✅ Success: Task created with ID: ${taskId}`);
    } else {
      throw new Error(`Failed to create task: ${createTaskData.message}`);
    }

    // 6. GET TASKS LIST (STANDARD USER)
    logger.info('TEST 6: Get Tasks List for Standard User');
    const getTasksRes = await fetch(`${BASE_URL}/tasks`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    const getTasksData = await getTasksRes.json();
    if (getTasksRes.status === 200) {
      logger.info(`✅ Success: Fetched ${getTasksData.results} tasks.`);
    } else {
      throw new Error(`Failed to get tasks: ${getTasksData.message}`);
    }

    // 7. VERIFY RBAC RESTRICTIONS (STANDARD USER BLOCKED FROM USER DIRECTORY)
    logger.info('TEST 7: Verify Standard User is Blocked from Admin Directory (RBAC)');
    const adminUsersRes = await fetch(`${BASE_URL}/users`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    const adminUsersData = await adminUsersRes.json();
    if (adminUsersRes.status === 403) {
      logger.info('✅ Success: Correctly blocked user with 403 Forbidden.');
    } else {
      throw new Error(`RBAC Failure: User was allowed to access admin directory (Status: ${adminUsersRes.status})`);
    }

    // 8. VERIFY RBAC ACCESS (ADMIN USER ALLOWED TO USER DIRECTORY)
    logger.info('TEST 8: Verify Admin User is Allowed to User Directory');
    const adminGetUsersRes = await fetch(`${BASE_URL}/users`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminGetUsersData = await adminGetUsersRes.json();
    if (adminGetUsersRes.status === 200) {
      logger.info(`✅ Success: Admin allowed access. Loaded ${adminGetUsersData.results} users.`);
    } else {
      throw new Error(`RBAC Failure: Admin blocked from accessing directory: ${adminGetUsersData.message}`);
    }

    // 9. UPDATE TASK status (STANDARD USER)
    logger.info('TEST 9: Update Task Status with Owner Token');
    const updateTaskRes = await fetch(`${BASE_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        status: 'completed',
        description: 'Successfully updated status to completed.'
      })
    });
    const updateTaskData = await updateTaskRes.json();
    if (updateTaskRes.status === 200) {
      logger.info('✅ Success: Task card updated status to completed.');
    } else {
      throw new Error(`Failed to update task: ${updateTaskData.message}`);
    }

    // 10. PROMOTE STANDARD USER ROLE (ADMIN ONLY)
    logger.info('TEST 10: Promote Standard User to Admin via Admin Token');
    const promoteRes = await fetch(`${BASE_URL}/users/${userIdToPromote}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ role: 'admin' })
    });
    const promoteData = await promoteRes.json();
    if (promoteRes.status === 200) {
      logger.info('✅ Success: Standard user promoted to admin role.');
    } else {
      throw new Error(`Failed to promote user role: ${promoteData.message}`);
    }

    logger.info('==================================================');
    logger.info('✅ ALL INTEGRATION TESTS PASSED SUCCESSFULLY!');
    logger.info('==================================================');
  } catch (error) {
    logger.error('❌ TEST RUN FAILED IN MIDDLE OF INTEGRATION FLOW:');
    logger.error(error);
    process.exit(1);
  }
}

// Start test suite
runTests();
