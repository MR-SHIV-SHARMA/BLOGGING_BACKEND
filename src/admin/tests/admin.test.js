import request from 'supertest';
import { app } from '../../app';

describe('Admin Login', () => {
  it('should login an admin with valid credentials', async () => {
    const response = await request(app)
      .post('/admin/login')
      .send({
        email: 'admin@example.com',
        password: 'password123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });

  it('should not login an admin with invalid credentials', async () => {
    const response = await request(app)
      .post('/admin/login')
      .send({
        email: 'admin@example.com',
        password: 'wrongpassword'
      });
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Invalid credentials');
  });
});
