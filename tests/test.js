import request from 'supertest';
import app from '../app.js'; // Adjust path to your Express app instance
import { connectTestDB, closeTestDB, clearTestDB } from './setup.js';
import User from '../models/user.js';
import Post from '../models/post.js';

let authToken;
let userId;
let testPostId;
let secondaryUserId;

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

// Helper function to create a primary user and return auth token
const setupPrimaryUser = async (shouldLogin = false) => {
  const userData = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    first_name: 'Test',
    last_name: 'User'
  };
  const signUpRes = await request(app).post('/auth/signup').send(userData)
  userId = signUpRes.body.user ? signUpRes.body.user._id : signUpRes.body._id;

  if (shouldLogin) {
    const loginRes = await request(app)
      .post('/auth/signin')
      .send({
        email: userData.email,
        password: userData.password
      });

    authToken = loginRes.body.token;
  } else {
    authToken = null;
  }
};

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================
describe('AUTH ENDPOINTS', () => {
  it('POST /auth/signup - should register a new user successfully', async () => {
    const res = await request(app).post('/auth/signup').send({
      username: 'newuser',
      email: 'new@example.com',
      password: 'password123'
    });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toBe('Signup successful');
    expect(res.body.user.username).toBe('newuser');
  });

  it('POST /auth/signin - should authenticate user and return token', async () => {
    await setupPrimaryUser();

    const res = await request(app).post('/auth/signin').send({
      email: 'test@example.com',
      password: 'password123'
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });
});

// ==========================================
// 2. POST ENDPOINTS
// ==========================================
describe('POST ENDPOINTS', () => {
  beforeEach(async () => {
    await setupPrimaryUser(true);
  });

  it('POST /posts - should create a new post with valid tags', async () => {
    const res = await request(app)
      .post('/posts')
      .auth(authToken, {type: 'bearer'})
      .send({
        title: 'Jest Testing Basics',
        content: 'Writing integration tests for Express and MongoDB.',
        tags: ['testing', 'nodejs', 'jest']
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body.post.title).toBe('Jest Testing Basics');
    expect(res.body.post.tags).toContain('testing');
    testPostId = res.body.post._id;
  });

  it('POST /posts - should reject tag shorter than 3 letters', async () => {
    const res = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Invalid Tag Post',
        content: 'This will fail validation.',
        tags: ['js'] // < 3 characters
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toMatch(/at least 3 letters/i);
  });

  it('GET /posts - should fetch all posts', async () => {
    const res = await request(app).get('/posts');

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('posts');
    expect(Array.isArray(res.body.posts)).toBe(true);
  });

  it('POST /posts/:id/like - should toggle post like and prevent duplicates', async () => {
    // Create post first
    const postRes = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Like Post Test', content: 'Testing post likes.', tags: ['test'] });

    const createdPostId = postRes.body.post._id;

    // First Click: Like
    const likeRes = await request(app)
      .post(`/posts/${createdPostId}/toggle_like`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(likeRes.statusCode).toEqual(200);
    expect(likeRes.body.liked).toBe(true);
    expect(likeRes.body.like_count).toBe(1);

    // Second Click: Unlike
    const unlikeRes = await request(app)
      .post(`/posts/${createdPostId}/toggle_like`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(unlikeRes.statusCode).toEqual(200);
    expect(unlikeRes.body.liked).toBe(false);
    expect(unlikeRes.body.like_count).toBe(0);
  });
});

// ==========================================
// 3. USER & FOLLOW ENDPOINTS
// ==========================================
describe('USER & FOLLOW ENDPOINTS', () => {
  beforeEach(async () => {
    await setupPrimaryUser(true);

    // Create a secondary user to follow/unfollow
    const targetUser = await User.create({
      username: 'targetuser',
      email: 'target@example.com',
      password: 'password123'
    });
    secondaryUserId = targetUser._id.toString();
  });

  it('POST /users/:id/follow - should follow and unfollow a user', async () => {
    // Follow target user
    const followRes = await request(app)
      .post(`/users/${secondaryUserId}/follow`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(followRes.statusCode).toEqual(200);
    expect(followRes.body.isFollowing).toBe(true);

    // Unfollow target user
    const unfollowRes = await request(app)
      .post(`/users/${secondaryUserId}/follow`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(unfollowRes.statusCode).toEqual(200);
    expect(unfollowRes.body.isFollowing).toBe(false);
  });

  it('POST /users/:id/follow - should prevent user from following self', async () => {
    const res = await request(app)
      .post(`/users/${userId}/follow`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe('You cannot follow yourself');
  });

  it('GET /users/following - should retrieve list of followed users', async () => {
    // Follow secondary user first
    await request(app)
      .post(`/users/${secondaryUserId}/follow`)
      .set('Authorization', `Bearer ${authToken}`);

    const res = await request(app)
      .get('/users/following')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.count).toBe(1);
    expect(res.body.users[0]._id).toBe(secondaryUserId);
  });
});